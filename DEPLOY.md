# Nisapoti deployment (91.99.50.186)

## Quick deploy from your Mac

1. Push latest code to GitHub:
   ```bash
   git add -A && git commit -m "Deploy" && git push
   ```

2. Run deploy (use your SSH password when prompted or via env):
   ```bash
   NISAPOTI_SSH_PASS='Nisapoti@2026' ./deploy.sh
   ```
   Or: `./deploy.sh` and enter the password when prompted.

3. **First deploy only:** The script will create `.env` from `ENV_TEMPLATE.txt` and exit. SSH in, edit `.env`, then run `./deploy.sh` again:
   ```bash
   ssh root@91.99.50.186
   nano /var/www/nisapoti/.env   # fill DB, JWT, SMTP, Snippe, SMS, NEXT_PUBLIC_BASE_URL
   exit
   ./deploy.sh
   ```

---

## Manual deploy (SSH)

```bash
ssh root@91.99.50.186
# password: Nisapoti@2026

cd /var/www/nisapoti

# First time: create .env from template
cp ENV_TEMPLATE.txt .env
nano .env   # fill in DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, SMTP_*, SNIPPE_*, SMS_*, NEXT_PUBLIC_BASE_URL

# Deploy
bash scripts/server-deploy.sh deploy
```

---

## Server layout

| Path | Purpose |
|------|---------|
| `/var/www/nisapoti` | App root (clone of GitHub) |
| `/var/www/nisapoti/.env` | Env vars (create from `ENV_TEMPLATE.txt`) |
| `/var/www/nisapoti/logs/` | PM2 logs |

## PM2

```bash
pm2 status
pm2 logs nisapoti
pm2 restart nisapoti
```

App runs on **port 3000** (`http://0.0.0.0:3000`). Put Nginx (or another reverse proxy) in front and point your domain to the server.

---

## Env vars (summary)

- **DB\_*** — MySQL (required)
- **JWT_SECRET** — Auth (required)
- **NEXT_PUBLIC_BASE_URL** — e.g. `https://nisapoti.com` (emails, Snippe webhook)
- **SMTP\_*** / **MAIL\_*** — Emails
- **SNIPPE\_*** — Payments / withdrawals
- **SMS\_*** — Mambo SMS (withdrawal notifications)

See `ENV_TEMPLATE.txt` for the full list.
