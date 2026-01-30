#!/bin/bash
# Ensure Nisapoti app is running on port 3000. Safe to run from cron every 5 min.
# Usage: bash scripts/ensure-app-running.sh
# Cron: */5 * * * * /var/www/nisapoti/scripts/ensure-app-running.sh >> /var/www/nisapoti/logs/cron-ensure-app.log 2>&1

APP_DIR="${NISAPOTI_APP_DIR:-/var/www/nisapoti}"
cd "$APP_DIR" || exit 0

# If nothing is listening on 3000, start or restart PM2
if ! command -v ss &>/dev/null; then
  CHECK=$(netstat -tlnp 2>/dev/null | grep ':3000 ') || true
else
  CHECK=$(ss -tlnp 2>/dev/null | grep ':3000 ') || true
fi

if [ -z "$CHECK" ]; then
  echo "$(date -Iseconds) Port 3000 not in use — starting nisapoti"
  export PATH="/usr/local/bin:/usr/bin:$PATH"
  pm2 start ecosystem.nisapoti.config.js 2>/dev/null || pm2 restart nisapoti
  pm2 save
fi
