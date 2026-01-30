#!/bin/bash
# Recover Nisapoti server: add swap, start app, enable PM2 on boot.
# Run on server as root: sudo bash scripts/server-recover.sh

set -e
APP_DIR="${NISAPOTI_APP_DIR:-/var/www/nisapoti}"
cd "$APP_DIR"

echo "=============================================="
echo "Nisapoti server recovery"
echo "=============================================="
echo ""

# 1. Add swap if none (prevents OOM kills)
if [ "$(awk '/^SwapTotal:/ {print $2}' /proc/meminfo)" = "0" ]; then
  echo "==> No swap found. Adding 2GB swap file..."
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo "✅ Swap enabled. Current: $(free -h | grep Swap)"
else
  echo "==> Swap already present: $(free -h | grep Swap)"
fi
echo ""

# 2. Start or restart the app
echo "==> Starting Nisapoti with PM2..."
export PATH="/usr/local/bin:/usr/bin:$PATH"
if pm2 describe nisapoti &>/dev/null; then
  pm2 restart nisapoti --update-env
else
  pm2 start ecosystem.nisapoti.config.js
fi
pm2 save
echo ""

# 3. Wait for app to listen on 3000
echo "==> Waiting for app to listen on port 3000..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if ss -tlnp 2>/dev/null | grep -q ':3000 '; then
    echo "✅ App is listening on port 3000"
    break
  fi
  sleep 2
  echo "  ... waiting ($i/15)"
done
if ! ss -tlnp 2>/dev/null | grep -q ':3000 '; then
  echo "⚠️ Port 3000 still not in use. Check: pm2 logs nisapoti"
  pm2 logs nisapoti --lines 20 --nostream
fi
echo ""

# 4. Ensure PM2 starts on reboot
echo "==> PM2 startup (run the command it prints if needed)..."
pm2 startup systemd -u root --hp /root 2>/dev/null || true
pm2 save
echo ""

echo "=============================================="
echo "Recovery done. Check: pm2 status && curl -I http://127.0.0.1:3000/"
echo "=============================================="
