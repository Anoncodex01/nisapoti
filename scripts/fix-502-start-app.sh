#!/bin/bash
# Fix 502 Bad Gateway: ensure Next.js app is running on port 3000
# Run on server: bash scripts/fix-502-start-app.sh

set -e
cd /var/www/nisapoti

echo "==> Checking PM2..."
pm2 list

echo ""
echo "==> Starting/restarting nisapoti..."
pm2 start ecosystem.nisapoti.config.js 2>/dev/null || pm2 restart nisapoti --update-env
pm2 save

echo ""
echo "==> Waiting for app to start..."
sleep 10

echo ""
echo "==> PM2 status:"
pm2 list

echo ""
echo "==> Testing localhost:3000..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null || echo "000")
if [ "$HTTP" = "200" ] || [ "$HTTP" = "304" ] || [ "$HTTP" = "302" ]; then
  echo "✅ App responding on port 3000 (HTTP $HTTP)"
else
  echo "⚠️ App not responding (got HTTP $HTTP). Check: pm2 logs nisapoti"
  pm2 logs nisapoti --lines 20 --nostream
fi

echo ""
echo "Done. If still 502, check: pm2 logs nisapoti"
