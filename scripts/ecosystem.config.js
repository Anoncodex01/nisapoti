module.exports = {
  apps: [
    {
      name: 'wishlist-expiration',
      script: 'scripts/process-expired-wishlists.js',
      cron_restart: '0 * * * *', // Run every hour
      autorestart: false,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_USER: process.env.DB_USER || 'root',
        DB_PASSWORD: process.env.DB_PASSWORD || '',
        DB_NAME: process.env.DB_NAME || 'nisapoti_nis'
      },
      error_file: './logs/wishlist-expiration-error.log',
      out_file: './logs/wishlist-expiration-out.log',
      log_file: './logs/wishlist-expiration.log',
      time: true
    }
  ]
};
