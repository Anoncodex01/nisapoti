/**
 * PM2 config for Nisapoti Next.js app (optimized for 4GB VPS)
 */
module.exports = {
  apps: [
    {
      name: 'nisapoti',
      script: 'npm',
      args: 'start',
      cwd: __dirname,

      // ✅ VERY IMPORTANT SETTINGS
      instances: 1,              // never use cluster for Next.js on small VPS
      exec_mode: 'fork',
      watch: false,
      autorestart: true,

      // ✅ Memory protection
      max_memory_restart: '400M',

      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=512'
      },

      // Logs
      error_file: './logs/nisapoti-error.log',
      out_file: './logs/nisapoti-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
