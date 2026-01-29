#!/bin/bash
# Complete deployment script - Run this ON the server
# Usage: bash scripts/complete-deployment.sh

set -e

APP_DIR="/var/www/nisapoti"
cd "$APP_DIR"

echo "=========================================="
echo "Nisapoti Complete Deployment"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from template..."
    cp ENV_TEMPLATE.txt .env
    echo "⚠️  Please edit .env with your configuration:"
    echo "   nano .env"
    exit 1
fi

echo "✅ .env file exists"

# Install dependencies
echo ""
echo "==> Installing dependencies..."
npm ci

# Build application
echo ""
echo "==> Building Next.js application..."
npm run build

# Create logs directory
mkdir -p logs

# Start/restart PM2
echo ""
echo "==> Starting PM2 process..."
if pm2 describe nisapoti &>/dev/null; then
    echo "Restarting existing PM2 process..."
    pm2 restart ecosystem.nisapoti.config.js
else
    echo "Starting new PM2 process..."
    pm2 start ecosystem.nisapoti.config.js
fi

pm2 save
pm2 status

echo ""
echo "=========================================="
echo "✅ Application deployed!"
echo "=========================================="
echo ""
echo "Application running on: http://0.0.0.0:3000"
echo ""
echo "Next steps:"
echo "1. Configure domain: bash scripts/configure-domain.sh"
echo "2. Check logs: pm2 logs nisapoti"
echo "3. Monitor: pm2 monit"
echo ""
