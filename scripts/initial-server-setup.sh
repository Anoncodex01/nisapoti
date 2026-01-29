#!/bin/bash
# Initial server setup for Nisapoti on DigitalOcean VPS (165.232.82.188)
# Run this ONCE on a fresh server before first deployment
# Usage: bash scripts/initial-server-setup.sh

set -e

echo "=========================================="
echo "Nisapoti Initial Server Setup"
echo "=========================================="
echo ""

# Update system
echo "==> Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install essential tools
echo "==> Installing essential tools..."
sudo apt-get install -y curl wget git build-essential

# Install Node.js 18.x
echo "==> Installing Node.js 18.x..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js $(node -v) installed"
else
    echo "✅ Node.js $(node -v) already installed"
fi

# Install PM2 globally
echo "==> Installing PM2..."
if ! command -v pm2 &>/dev/null; then
    sudo npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 $(pm2 -v) already installed"
fi

# Install MySQL client (for database operations)
echo "==> Installing MySQL client..."
sudo apt-get install -y mysql-client

# Install Nginx
echo "==> Installing Nginx..."
if ! command -v nginx &>/dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi

# Install Certbot for SSL
echo "==> Installing Certbot..."
if ! command -v certbot &>/dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi

# Setup firewall
echo "==> Configuring firewall..."
if command -v ufw &>/dev/null; then
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp     # HTTP
    sudo ufw allow 443/tcp    # HTTPS
    sudo ufw --force enable
    echo "✅ Firewall configured"
else
    echo "⚠️  UFW not found, skipping firewall setup"
fi

# Create app directory
echo "==> Creating app directory..."
sudo mkdir -p /var/www/nisapoti
sudo chown -R $USER:$USER /var/www/nisapoti
echo "✅ App directory created: /var/www/nisapoti"

# Setup PM2 startup script
echo "==> Setting up PM2 startup..."
pm2 startup systemd -u $USER --hp /home/$USER
echo "✅ PM2 startup configured"

echo ""
echo "=========================================="
echo "✅ Initial server setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository:"
echo "   cd /var/www/nisapoti"
echo "   git clone https://github.com/Anoncodex01/nisapoti.git ."
echo ""
echo "2. Create .env file from template:"
echo "   cp ENV_TEMPLATE.txt .env"
echo "   nano .env  # Fill in your configuration"
echo ""
echo "3. Run deployment:"
echo "   bash scripts/server-deploy.sh deploy"
echo ""
echo "Or deploy from your local machine:"
echo "   NISAPOTI_SSH_PASS='NisapoTi@2026i' ./deploy.sh"
echo ""
