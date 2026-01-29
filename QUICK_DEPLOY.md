# 🚀 Quick Deployment Guide

## One-Command Deployment

```bash
NISAPOTI_SSH_PASS='NisapoTi@2026i' ./deploy.sh
```

That's it! The script will handle everything.

---

## First Time Setup

If this is a fresh server, run initial setup first:

```bash
# Copy setup script to server
scp scripts/initial-server-setup.sh root@165.232.82.188:/tmp/

# Run setup
ssh root@165.232.82.188 "bash /tmp/initial-server-setup.sh"

# Then deploy
NISAPOTI_SSH_PASS='NisapoTi@2026i' ./deploy.sh
```

---

## Configure Environment Variables

After first deployment, configure `.env`:

```bash
ssh root@165.232.82.188
cd /var/www/nisapoti
nano .env
# Fill in: DB_*, JWT_SECRET, NEXT_PUBLIC_BASE_URL, SMTP_*, SNIPPE_*, SMS_*
exit

# Deploy again
NISAPOTI_SSH_PASS='NisapoTi@2026i' ./deploy.sh
```

---

## Setup SSL (Nginx + Let's Encrypt)

```bash
ssh root@165.232.82.188
cd /var/www/nisapoti
sudo bash scripts/setup-nginx-ssl.sh
```

**Note:** Ensure your domain DNS points to `165.232.82.188` before running.

---

## Check Status

```bash
ssh root@165.232.82.188
pm2 status
pm2 logs nisapoti
```

---

## Server Info

- **IP:** 165.232.82.188
- **User:** root
- **Password:** NisapoTi@2026i
- **App Directory:** /var/www/nisapoti
- **Port:** 3000

For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
