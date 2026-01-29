#!/bin/bash
# Run ON the server (root@165.232.82.188) to install Nginx + SSL for nisapoti.com
# Usage: sudo bash scripts/setup-nginx-ssl.sh
# Prereq: DNS for nisapoti.com must point to this server (165.232.82.188)

set -e

DOMAIN="${NISAPOTI_DOMAIN:-nisapoti.com}"
APP_PORT=3000
NGINX_SITE="/etc/nginx/sites-available/nisapoti"

echo "==> Domain: $DOMAIN, app port: $APP_PORT"

# Install nginx and certbot
if ! command -v nginx &>/dev/null; then
  echo "==> Installing Nginx..."
  apt-get update
  apt-get install -y nginx
fi
if ! command -v certbot &>/dev/null; then
  echo "==> Installing Certbot..."
  apt-get install -y certbot python3-certbot-nginx
fi

# Allow ports 80 and 443 if ufw is in use
if command -v ufw &>/dev/null; then
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
  ufw --force enable 2>/dev/null || true
fi

# Initial HTTP-only config (certbot needs port 80 for challenge)
echo "==> Writing Nginx config..."
cat > "$NGINX_SITE" << 'NGINX_HTTP'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_HTTP
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$NGINX_SITE"

# Enable site
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/
# Remove default site if it conflicts
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx

echo "==> Nginx is serving HTTP. Getting SSL certificate..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect || true

echo "==> Done. Test: curl -I https://$DOMAIN"
