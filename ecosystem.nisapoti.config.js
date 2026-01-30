/**
 * PM2 config for Nisapoti Next.js app (production).
 * Usage: pm2 start ecosystem.nisapoti.config.js
 *
 * Hardened for stuck/slow servers:
 * - exp_backoff_restart_delay: avoid restart thrashing (wait longer after each crash)
 * - max_memory_restart: restart if app uses > 1G to prevent OOM
 * - min_uptime: treat as started only after 10s (avoids rapid restart loop)
 */
module.exports = {
  apps: [
    {
      name: 'nisapoti',
      script: './node_modules/.bin/next',
      args: 'start -H 0.0.0.0 -p 3000',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 20,
      restart_delay: 5000,
      exp_backoff_restart_delay: 200,
      env: { NODE_ENV: 'production' },
      error_file: './logs/nisapoti-error.log',
      out_file: './logs/nisapoti-out.log',
      log_file: './logs/nisapoti.log',
      time: true,
      merge_logs: true,
    },
  ],
};
