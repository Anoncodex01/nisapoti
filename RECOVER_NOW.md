# Recover Server Now (502 / Nothing on Port 3000)

Your health check showed: **no swap**, **~565MB available RAM**, **nothing on port 3000**.  
You do **not** need to reset the server. Do this on the server:

---

## Option A: One script (after you pull)

```bash
ssh root@91.99.50.186
# password: Nisapoti@2026

cd /var/www/nisapoti
git pull origin main
sudo bash scripts/server-recover.sh
```

The script will: add 2GB swap, start/restart the app with PM2, and set PM2 to start on reboot.

---

## Option B: Manual steps (copy-paste)

Run these on the server one by one.

### 1. Add swap (stops OOM kills)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

You should see **2Gi** under Swap.

### 2. Go to app and start it

```bash
cd /var/www/nisapoti
pm2 start ecosystem.nisapoti.config.js
pm2 save
```

If PM2 says the app already exists but is stopped:

```bash
pm2 restart nisapoti --update-env
pm2 save
```

### 3. Wait and check

```bash
sleep 15
pm2 status
curl -I http://127.0.0.1:3000/
```

You want **HTTP/1.1 200** (or 302). If you get "Connection refused", run:

```bash
pm2 logs nisapoti --lines 30
```

and fix any error (e.g. database, `.env`).

### 4. PM2 on reboot (optional but recommended)

```bash
pm2 startup
```

Run the **exact command** it prints (e.g. `sudo env PATH=... pm2 startup systemd -u root ...`), then:

```bash
pm2 save
```

---

## If the app still doesn’t start

Check logs:

```bash
cd /var/www/nisapoti
pm2 logs nisapoti --lines 50
```

Common causes:

- **Database:** `.env` has wrong `DB_HOST` / `DB_USER` / `DB_PASSWORD` or DB is unreachable.
- **Build:** No `.next` folder — run `npm run build` then `pm2 restart nisapoti`.

---

## Do you need to reset the server?

**No.** Reset (reinstall OS) is only if the system is broken (e.g. disk corruption, wrong OS).  
Your case is low memory + no swap + app not started. Adding swap and starting PM2 is enough.

After recovery, deploy as usual:

```bash
cd /var/www/nisapoti
git pull origin main
npm run build
pm2 restart nisapoti
pm2 save
```
