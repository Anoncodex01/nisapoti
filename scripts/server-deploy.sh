#!/bin/bash
# Nisapoti server deploy script — run ON the server (165.232.82.188)
# Usage: bash scripts/server-deploy.sh [install|deploy]

set -e

APP_DIR="${NISAPOTI_APP_DIR:-/var/www/nisapoti}"
REPO_URL="https://github.com/Anoncodex01/nisapoti.git"
LOG_DIR="$APP_DIR/logs"
ENV_FILE="$APP_DIR/.env"

install_deps() {
  echo "==> Checking Node.js..."
  if ! command -v node &>/dev/null; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  node -v && npm -v

  echo "==> Checking Git..."
  command -v git &>/dev/null || sudo apt-get install -y git

  echo "==> Checking PM2..."
  if ! command -v pm2 &>/dev/null; then
    sudo npm install -g pm2
  fi
  pm2 -v
}

clone_or_pull() {
  if [ -d "$APP_DIR/.git" ]; then
    echo "==> Pulling latest from GitHub..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
  else
    echo "==> Cloning repository..."
    sudo mkdir -p "$(dirname "$APP_DIR")"
    sudo git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
    sudo chown -R "$(whoami):$(whoami)" "$APP_DIR"
  fi
}

setup_env() {
  cd "$APP_DIR"
  if [ ! -f "$ENV_FILE" ]; then
    echo "==> No .env found. Creating from template..."
    if [ -f "ENV_TEMPLATE.txt" ]; then
      cp ENV_TEMPLATE.txt "$ENV_FILE"
      echo "Edit $ENV_FILE with your DB, SMTP, Snippe, SMS, and JWT settings, then run deploy again."
      exit 1
    fi
    echo "Create $ENV_FILE with DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, etc."
    exit 1
  fi
  echo "==> .env exists."
}

build_and_start() {
  cd "$APP_DIR"
  mkdir -p "$LOG_DIR"

  echo "==> Installing dependencies..."
  [ -f package-lock.json ] && npm ci || npm install

  echo "==> Building Next.js..."
  npm run build

  echo "==> Restarting PM2 (nisapoti)..."
  if pm2 describe nisapoti &>/dev/null; then
    pm2 restart ecosystem.nisapoti.config.js
  else
    pm2 start ecosystem.nisapoti.config.js
  fi
  pm2 save
  pm2 status

  echo ""
  echo "==> Nisapoti deployed. App: http://0.0.0.0:3000"
  echo "    Logs: pm2 logs nisapoti"
}

case "${1:-deploy}" in
  install) install_deps ;;
  deploy)
    install_deps
    clone_or_pull
    setup_env
    build_and_start
    ;;
  *) echo "Usage: $0 install|deploy"; exit 1 ;;
esac
