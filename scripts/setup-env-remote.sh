#!/bin/bash
# One-liner to setup .env on server
# Run: bash scripts/setup-env-remote.sh

sshpass -p 'Nisapoti@2026' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 root@91.99.50.186 << 'ENVEOF'
cd /var/www/nisapoti
cat > .env << 'EOF'
# JWT Secret
JWT_SECRET=a952121483963ccc0a3f8a160ad9e100f1ab37486f4f515e5eb92620a8b11fde7316d985fc50c195f40b43edd68c426217e0540d2963c3f0ba1d131cd16ab7b2

# Database Configuration
DB_HOST=192.250.229.162
DB_USER=nisapoti_nis
DB_PASSWORD=Alvin@2025
DB_NAME=nisapoti_nis
DB_PORT=3306

# App URL
NEXT_PUBLIC_BASE_URL=https://nisapoti.com

# SMTP / Mail Configuration
SMTP_HOST=mail.nisapoti.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@nisapoti.com
SMTP_PASS=Alvin@2025
SMTP_FROM=no-reply@nisapoti.com
MAIL_HOST=mail.nisapoti.com
MAIL_PORT=465
MAIL_USERNAME=no-reply@nisapoti.com
MAIL_PASSWORD=Alvin@2025
MAIL_FROM_NAME=Nisapoti
MAIL_FROM_ADDRESS=no-reply@nisapoti.com

# Snippe Payment Configuration
SNIPPE_API_KEY=snp_a08a932e89ad34a1c73a20bca8f8bbf4d9e6a25739ea797b2cf0c4439d008743
SNIPPE_BASE_URL=https://api.snippe.sh
SNIPPE_WEBHOOK_URL=https://nisapoti.com/api/payments/snippe-webhook

# SMS Configuration (Mambo SMS)
SMS_BASE_URL=https://mambosms.co.tz
SMS_API_KEY=your_sms_api_key_here
SMS_SENDER_ID=Nisapoti
SMS_PHONE_NUMBER=0622551047
SMS_PASSWORD=123456789

# Legacy Pawapay (if still used)
PAWAPAY_API_KEY=eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjE0NDEiLCJtYXYiOiIxIiwiZXhwIjoyMDczMTI5MjI0LCJpYXQiOjE3NTc1OTY0MjQsInBtIjoiREFGLFBBRiIsImp0aSI6IjRhOTA5NGI4LTZmNmQtNDJjZi1hNTY3LTljYWFlNDQ4M2E5YiJ9.BAmXw8MVErFphH5LLKSpIECJ6z8djMINz19ElUN4JKawavHjobnSYSRqEj06-0mT9oUmVK_J31buka85g2U0xA
PAWAPAY_BASE_URL=https://api.pawapay.io
PAWAPAY_WEBHOOK_URL=https://nisapoti.com/api/payments/webhook
EOF
chmod 600 .env
echo "✅ .env created on server"
ENVEOF
