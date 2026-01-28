# VPS Deployment Guide for Wishlist Expiration

## Overview
This guide shows how to deploy the wishlist expiration script on a VPS server.

## Prerequisites
- VPS with Ubuntu/CentOS/Debian
- Node.js installed
- MySQL database
- Your project deployed

## Option 1: Crontab (Simplest)

### 1. Install Dependencies
```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install project dependencies
cd /path/to/your/project
npm install
```

### 2. Set Up Environment
```bash
# Copy environment file
cp .env.local.example .env.local

# Edit with your database credentials
nano .env.local
```

### 3. Configure Crontab
```bash
# Make script executable
chmod +x scripts/process-expired-wishlists.js

# Edit crontab
crontab -e

# Add this line (replace /path/to/your/project with actual path)
0 * * * * cd /path/to/your/project && /usr/bin/node scripts/process-expired-wishlists.js >> /var/log/wishlist-expiration.log 2>&1

# Check crontab
crontab -l
```

### 4. Test the Script
```bash
# Test manually
cd /path/to/your/project
node scripts/process-expired-wishlists.js

# Check logs
tail -f /var/log/wishlist-expiration.log
```

## Option 2: Systemd Service (Recommended)

### 1. Create Service Files
```bash
# Copy service files
sudo cp scripts/wishlist-expiration.service /etc/systemd/system/
sudo cp scripts/wishlist-expiration.timer /etc/systemd/system/

# Edit the service file with correct paths
sudo nano /etc/systemd/system/wishlist-expiration.service
```

### 2. Update Service File
```bash
# Replace /path/to/your/project with actual path
WorkingDirectory=/var/www/nisapoti
ExecStart=/usr/bin/node /var/www/nisapoti/scripts/process-expired-wishlists.js
```

### 3. Enable and Start
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable timer
sudo systemctl enable wishlist-expiration.timer

# Start timer
sudo systemctl start wishlist-expiration.timer

# Check status
sudo systemctl status wishlist-expiration.timer
sudo systemctl status wishlist-expiration.service

# View logs
sudo journalctl -u wishlist-expiration.service -f
```

## Option 3: PM2 Process Manager (Best for Node.js)

### 1. Install PM2
```bash
# Install PM2 globally
npm install -g pm2

# Install PM2 startup script
pm2 startup
```

### 2. Configure PM2
```bash
# Copy ecosystem config
cp scripts/ecosystem.config.js ./

# Edit with correct paths
nano ecosystem.config.js
```

### 3. Start with PM2
```bash
# Start the cron job
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs wishlist-expiration
```

## Option 4: Docker (If using Docker)

### 1. Create Docker Setup
```bash
# Copy Docker files
cp scripts/Dockerfile.cron ./
cp scripts/docker-compose.cron.yml ./

# Build and run
docker-compose -f docker-compose.cron.yml up -d

# Check logs
docker-compose -f docker-compose.cron.yml logs -f
```

## Monitoring and Logs

### 1. Check Script Status
```bash
# For crontab
tail -f /var/log/wishlist-expiration.log

# For systemd
sudo journalctl -u wishlist-expiration.service -f

# For PM2
pm2 logs wishlist-expiration

# For Docker
docker-compose -f docker-compose.cron.yml logs -f
```

### 2. Test Script Manually
```bash
# Test the script
cd /path/to/your/project
node scripts/process-expired-wishlists.js

# Check database for expired wishlists
mysql -u root -p nisapoti_nis -e "SELECT COUNT(*) as expired_wishlists FROM wishlist WHERE expires_at <= NOW() AND is_expired = FALSE;"
```

### 3. Monitor Database
```sql
-- Check expired wishlists
SELECT id, name, expires_at, amount_funded, price, is_expired 
FROM wishlist 
WHERE expires_at <= NOW() 
  AND is_expired = FALSE
  AND amount_funded < price;

-- Check migration status
SELECT 
  COUNT(*) as total_wishlists,
  SUM(CASE WHEN duration_days IS NOT NULL AND duration_days > 0 THEN 1 ELSE 0 END) as migrated_wishlists,
  SUM(CASE WHEN is_expired = TRUE THEN 1 ELSE 0 END) as expired_wishlists
FROM wishlist;
```

## Troubleshooting

### Common Issues:

1. **Permission Denied**
   ```bash
   chmod +x scripts/process-expired-wishlists.js
   chown www-data:www-data scripts/process-expired-wishlists.js
   ```

2. **Database Connection Failed**
   - Check `.env.local` file
   - Verify database credentials
   - Test connection: `mysql -u root -p nisapoti_nis`

3. **Script Not Running**
   - Check crontab: `crontab -l`
   - Check systemd: `sudo systemctl status wishlist-expiration.timer`
   - Check PM2: `pm2 status`

4. **Logs Not Working**
   - Check log file permissions
   - Verify log directory exists
   - Check disk space

### Debug Commands:
```bash
# Test database connection
node -e "require('dotenv').config({path: '.env.local'}); console.log(process.env.DB_HOST);"

# Test script with verbose output
node scripts/process-expired-wishlists.js

# Check cron logs
grep CRON /var/log/syslog

# Check systemd logs
sudo journalctl -u wishlist-expiration.service --since "1 hour ago"
```

## Security Considerations

1. **File Permissions**
   ```bash
   chmod 600 .env.local
   chmod 755 scripts/process-expired-wishlists.js
   ```

2. **Database Access**
   - Use dedicated database user
   - Limit permissions to necessary tables
   - Use strong passwords

3. **Log Rotation**
   ```bash
   # Add to /etc/logrotate.d/wishlist-expiration
   /var/log/wishlist-expiration.log {
       daily
       missingok
       rotate 7
       compress
       notifempty
   }
   ```

## Performance Optimization

1. **Database Indexes**
   ```sql
   CREATE INDEX idx_expires_at ON wishlist(expires_at);
   CREATE INDEX idx_is_expired ON wishlist(is_expired);
   ```

2. **Script Optimization**
   - Run during low-traffic hours
   - Use database transactions
   - Limit batch sizes

3. **Monitoring**
   - Set up alerts for failures
   - Monitor database performance
   - Track script execution time

## Backup and Recovery

1. **Database Backup**
   ```bash
   # Daily backup
   mysqldump -u root -p nisapoti_nis > backup_$(date +%Y%m%d).sql
   ```

2. **Script Backup**
   ```bash
   # Backup scripts
   tar -czf wishlist-scripts-$(date +%Y%m%d).tar.gz scripts/
   ```

3. **Recovery**
   ```bash
   # Restore database
   mysql -u root -p nisapoti_nis < backup_20240101.sql
   
   # Restore scripts
   tar -xzf wishlist-scripts-20240101.tar.gz
   ```

## Recommended Setup

For production VPS, I recommend:

1. **Use Systemd Service** (most reliable)
2. **Set up log rotation**
3. **Monitor with alerts**
4. **Regular database backups**
5. **Test in staging first**

This ensures your wishlist expiration system runs reliably on your VPS! 🚀
