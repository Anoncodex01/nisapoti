# Nisapoti Deployment Guide - DigitalOcean VPS

**Server IP:** `165.232.82.188`  
**SSH User:** `root`  
**SSH Password:** `NisapoTi@2026i`

---

## 🚀 Quick Start Deployment

### Option 1: Automated Deployment (Recommended)

From your local machine:

```bash
# 1. Make sure your code is pushed to GitHub
git add -A && git commit -m "Deploy" && git push

# 2. Run deployment script
NISAPOTI_SSH_PASS='NisapoTi@2026i' ./deploy.sh
```

The script will:
- Clone/pull the repository
- Install dependencies
- Build the Next.js app
- Start/restart PM2 process

---

## 📋 Initial Server Setup (First Time Only)

If this is a fresh server, run the initial setup script:

### From Local Machine:

```bash
# Copy and run initial setup script
scp scripts/initial-server-setup.sh root@165.232.82.188:/tmp/
ssh root@165.232.82.188 "bash /tmp/initial-server-setup.sh"
```

### Or SSH into server and run:

```bash
ssh root@165.232.82.188
# Password: NisapoTi@2026i

# Clone repository first
cd /var/www
git clone https://github.com/Anoncodex01/nisapoti.git nisapoti
cd nisapoti

# Run initial setup
bash scripts/initial-server-setup.sh
```

This will install:
- Node.js 18.x
- PM2 (process manager)
- Nginx (web server)
- Certbot (SSL certificates)
- MySQL client
- Firewall configuration

---

## ⚙️ Environment Configuration

### First Time Setup:

1. **SSH into server:**
   ```bash
   ssh root@165.232.82.188
   ```

2. **Navigate to app directory:**
   ```bash
   cd /var/www/nisapoti
   ```

3. **Create .env file from template:**
   ```bash
   cp ENV_TEMPLATE.txt .env
   nano .env
   ```

4. **Fill in required values:**

   **Database Configuration:**
   ```env
   DB_HOST=localhost          # or remote MySQL host
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=nisapoti_nis
   ```

   **JWT Secret:**
   ```env
   JWT_SECRET=your_secure_random_string_here
   ```
   Generate one with: `openssl rand -hex 64`

   **App URL:**
   ```env
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   ```

   **SMTP Configuration:**
   ```env
   SMTP_HOST=mail.your-domain.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=no-reply@your-domain.com
   SMTP_PASS=your_smtp_password
   SMTP_FROM=no-reply@your-domain.com
   ```

   **Snippe Payment:**
   ```env
   SNIPPE_API_KEY=your_snippe_api_key
   SNIPPE_BASE_URL=https://api.snippe.sh
   SNIPPE_WEBHOOK_URL=https://your-domain.com/api/payments/snippe-webhook
   ```

   **SMS Configuration (Mambo SMS):**
   ```env
   SMS_BASE_URL=https://mambosms.co.tz
   SMS_API_KEY=your_sms_api_key
   SMS_SENDER_ID=Nisapoti
   SMS_PHONE_NUMBER=your_phone_number
   SMS_PASSWORD=your_sms_password
   ```

5. **Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## 🗄️ Database Setup

### If using remote MySQL:

Ensure your MySQL server allows connections from `165.232.82.188`:

```sql
-- On MySQL server
CREATE USER 'nisapoti_user'@'165.232.82.188' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON nisapoti_nis.* TO 'nisapoti_user'@'165.232.82.188';
FLUSH PRIVILEGES;
```

### If installing MySQL locally on VPS:

```bash
sudo apt-get install -y mysql-server
sudo mysql_secure_installation

# Create database and user
sudo mysql -e "CREATE DATABASE nisapoti_nis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'nisapoti_user'@'localhost' IDENTIFIED BY 'secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON nisapoti_nis.* TO 'nisapoti_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### Import Database Schema:

```bash
cd /var/www/nisapoti
# Import all SQL files from database/ directory
mysql -u nisapoti_user -p nisapoti_nis < database/simplified_shop_schema.sql
mysql -u nisapoti_user -p nisapoti_nis < database/payment_schema.sql
mysql -u nisapoti_user -p nisapoti_nis < database/referral_schema.sql
# ... import other schema files as needed
```

---

## 🌐 Nginx & SSL Configuration

### Setup Nginx with SSL:

```bash
ssh root@165.232.82.188
cd /var/www/nisapoti
sudo bash scripts/setup-nginx-ssl.sh
```

**Before running, ensure:**
- Your domain DNS points to `165.232.82.188`
- Ports 80 and 443 are open in firewall

The script will:
- Configure Nginx as reverse proxy to port 3000
- Obtain Let's Encrypt SSL certificate
- Set up automatic renewal

### Manual Nginx Configuration:

If you prefer manual setup, create `/etc/nginx/sites-available/nisapoti`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/nisapoti /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Then get SSL:
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🔄 Deployment Process

### Automated Deployment:

```bash
# From local machine
NISAPOTI_SSH_PASS='NisapoTi@2026i' ./deploy.sh
```

### Manual Deployment:

```bash
ssh root@165.232.82.188
cd /var/www/nisapoti

# Pull latest code
git fetch origin
git reset --hard origin/main

# Install dependencies
npm ci

# Build application
npm run build

# Restart PM2
pm2 restart ecosystem.nisapoti.config.js
pm2 save
```

---

## 📊 PM2 Process Management

### Check Status:
```bash
pm2 status
pm2 logs nisapoti
```

### Restart Application:
```bash
pm2 restart nisapoti
```

### Stop Application:
```bash
pm2 stop nisapoti
```

### View Logs:
```bash
pm2 logs nisapoti --lines 100
# Or tail log files directly
tail -f /var/www/nisapoti/logs/nisapoti.log
```

### Monitor:
```bash
pm2 monit
```

---

## 🔍 Troubleshooting

### Application not starting:

1. **Check PM2 logs:**
   ```bash
   pm2 logs nisapoti --err
   ```

2. **Check if port 3000 is in use:**
   ```bash
   sudo netstat -tulpn | grep 3000
   ```

3. **Verify .env file:**
   ```bash
   cd /var/www/nisapoti
   cat .env  # Check all required vars are set
   ```

4. **Test database connection:**
   ```bash
   mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT 1;"
   ```

### Nginx not working:

1. **Check Nginx status:**
   ```bash
   sudo systemctl status nginx
   ```

2. **Test Nginx config:**
   ```bash
   sudo nginx -t
   ```

3. **Check error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### SSL Certificate Issues:

1. **Renew certificate:**
   ```bash
   sudo certbot renew
   ```

2. **Check certificate expiry:**
   ```bash
   sudo certbot certificates
   ```

### Build Failures:

1. **Clear Next.js cache:**
   ```bash
   cd /var/www/nisapoti
   rm -rf .next
   npm run build
   ```

2. **Check Node.js version:**
   ```bash
   node -v  # Should be 18.x
   ```

---

## 🔐 Security Checklist

- [ ] Firewall configured (UFW or iptables)
- [ ] SSH key authentication enabled (disable password auth)
- [ ] .env file permissions set to 600
- [ ] Database user has minimal required privileges
- [ ] SSL certificate installed and auto-renewal enabled
- [ ] PM2 process running as non-root user (if possible)
- [ ] Regular backups configured
- [ ] Log rotation configured

---

## 📁 Server Directory Structure

```
/var/www/nisapoti/          # Application root
├── .env                    # Environment variables (600 permissions)
├── .next/                  # Next.js build output
├── logs/                   # PM2 logs
│   ├── nisapoti-error.log
│   ├── nisapoti-out.log
│   └── nisapoti.log
├── public/                 # Static assets
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities
└── scripts/                # Deployment scripts
```

---

## 🔄 Updating Application

### Regular Updates:

```bash
# From local machine
git add -A && git commit -m "Update" && git push
NISAPOTI_SSH_PASS='NisapoTi@2026i' ./deploy.sh
```

### Rollback:

```bash
ssh root@165.232.82.188
cd /var/www/nisapoti
git log --oneline  # Find previous commit
git reset --hard <commit-hash>
npm ci
npm run build
pm2 restart nisapoti
```

---

## 📞 Support

For issues or questions:
- Check PM2 logs: `pm2 logs nisapoti`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Review deployment logs in `/var/www/nisapoti/logs/`

---

## ✅ Post-Deployment Verification

After deployment, verify:

1. **Application is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **PM2 process is active:**
   ```bash
   pm2 status
   ```

3. **Nginx is proxying correctly:**
   ```bash
   curl -I https://your-domain.com
   ```

4. **SSL certificate is valid:**
   ```bash
   echo | openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates
   ```

5. **Database connection works:**
   - Test through application UI
   - Check API endpoints

---

**Last Updated:** January 2026  
**Server:** DigitalOcean VPS (165.232.82.188)
