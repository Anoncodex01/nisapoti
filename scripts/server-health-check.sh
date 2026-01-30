#!/bin/bash
# Server health check — run on the server to see why it's stuck/slow
# Usage: bash scripts/server-health-check.sh

echo "=============================================="
echo "Nisapoti server health check"
echo "=============================================="
echo ""

echo "=== 1. Memory (free -h) ==="
free -h
echo ""

echo "=== 2. Swap ==="
swapon --show 2>/dev/null || echo "No swap configured"
echo ""

echo "=== 3. Disk space ==="
df -h /
echo ""

echo "=== 4. Load average (top 1 line) ==="
uptime
echo ""

echo "=== 5. Port 3000 in use? ==="
ss -tlnp | grep 3000 || netstat -tlnp 2>/dev/null | grep 3000 || echo "Nothing listening on 3000"
echo ""

echo "=== 6. PM2 status ==="
cd /var/www/nisapoti 2>/dev/null || cd "$(dirname "$0")/.."
pm2 list 2>/dev/null || echo "PM2 not running or app not found"
echo ""

echo "=== 7. Last 15 lines of PM2 error log ==="
tail -15 /var/www/nisapoti/logs/nisapoti-error.log 2>/dev/null || echo "No error log"
echo ""

echo "=== 8. Node processes ==="
ps aux | grep -E 'node|next' | grep -v grep | head -10
echo ""

echo "=============================================="
echo "Quick fixes to try:"
echo "  1. Restart app:    pm2 restart nisapoti"
echo "  2. Add swap:       sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
echo "  3. Free memory:    pm2 restart nisapoti (restarts Node and frees RAM)"
echo "  4. Ensure PM2 on reboot: pm2 startup && pm2 save"
echo "=============================================="
