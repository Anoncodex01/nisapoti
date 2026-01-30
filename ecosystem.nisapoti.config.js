/**
 * PM2 config for Nisapoti Next.js app (production).
 * Usage: pm2 start ecosystem.nisapoti.config.js
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
      env: { NODE_ENV: 'production' },
      error_file: './logs/nisapoti-error.log',
      out_file: './logs/nisapoti-out.log',
      log_file: './logs/nisapoti.log',
      time: true,
      merge_logs: true,
    },
  ],
};
