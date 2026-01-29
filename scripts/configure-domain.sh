#!/bin/bash
# Configure Nginx and SSL for nisapoti.com
# Run this on the server: bash scripts/configure-domain.sh

set -e

DOMAIN="nisapoti.com"
APP_PORT=3000
NGINX_SITE="/etc/nginx/sites-available/nisapoti"

echo "=========================================="
echo "Configuring Nginx for $DOMAIN"
echo "=========================================="
echo ""

# Check if Nginx is installed
if ! command -v nginx &>/dev/null; then
  echo "==> Installing Nginx..."
  apt-get update
  apt-get install -y nginx
fi

# Check if Certbot is installed
if ! command -v certbot &>/dev/null; then
  echo "==> Installing Certbot..."
  apt-get install -y certbot python3-certbot-nginx
fi

# Allow ports 80 and 443 if ufw is in use
if command -v ufw &>/dev/null; then
  echo "==> Configuring firewall..."
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
  ufw --force enable 2>/dev/null || true
fi

# Create Nginx configuration
echo "==> Creating Nginx configuration..."
cat > "$NGINX_SITE" << NGINX_CONFIG
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Redirect www to non-www (optional, remove if you want both)
    # if (\$host = www.${DOMAIN}) {
    #     return 301 http://${DOMAIN}\$request_uri;
    # }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_CONFIG

# Enable site
echo "==> Enabling Nginx site..."
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/

# Remove default site if it conflicts
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test Nginx configuration
echo "==> Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "==> Reloading Nginx..."
systemctl reload nginx

echo ""
echo "✅ Nginx configured for HTTP"
echo ""
echo "=========================================="
echo "Setting up SSL Certificate"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Ensure DNS for $DOMAIN points to this server IP"
echo "   Current server IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to detect')"
echo ""

# Get SSL certificate
echo "==> Obtaining SSL certificate from Let's Encrypt..."
if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect; then
    echo ""
    echo "✅ SSL certificate installed successfully!"
    echo ""
    echo "==> Testing HTTPS..."
    curl -I "https://$DOMAIN" 2>&1 | head -5 || echo "⚠️  Could not test HTTPS (may need DNS propagation)"
else
    echo ""
    echo "⚠️  SSL certificate setup failed. Common reasons:"
    echo "   1. DNS for $DOMAIN doesn't point to this server"
    echo "   2. Port 80 is blocked by firewall"
    echo "   3. Domain already has a certificate elsewhere"
    echo ""
    echo "You can retry SSL setup later with:"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

echo ""
echo "=========================================="
echo "✅ Domain configuration complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify DNS: host $DOMAIN"
echo "2. Test HTTP: curl -I http://$DOMAIN"
echo "3. Test HTTPS: curl -I https://$DOMAIN"
echo "4. Check Nginx status: systemctl status nginx"
echo "5. View Nginx logs: tail -f /var/log/nginx/error.log"
echo ""
