#!/bin/bash
# Deploy Nisapoti to server 165.232.82.188
# Run from project root. Uses sshpass for password auth.
#
# Usage:
#   NISAPOTI_SSH_PASS='yourpassword' ./deploy.sh
#   ./deploy.sh   # will prompt if NISAPOTI_SSH_PASS not set

set -e

HOST="165.232.82.188"
USER="root"
APP_DIR="/var/www/nisapoti"
SCRIPT="scripts/server-deploy.sh"

if [ -z "${NISAPOTI_SSH_PASS}" ]; then
  echo "Set NISAPOTI_SSH_PASS and re-run, or enter password when prompted."
  echo "Example: NISAPOTI_SSH_PASS='NisapoTi@2026i' ./deploy.sh"
  read -r -s -p "SSH password: " NISAPOTI_SSH_PASS
  echo
fi

if [ -z "${NISAPOTI_SSH_PASS}" ]; then
  echo "No password provided. Aborting."
  exit 1
fi

export NISAPOTI_SSH_PASS

# Clone if missing, else pull; then run server deploy script
RUN="
  set -e;
  if [ ! -d $APP_DIR/.git ]; then
    echo 'First-time setup: cloning repo...';
    sudo mkdir -p /var/www;
    sudo git clone https://github.com/Anoncodex01/nisapoti.git $APP_DIR;
    sudo chown -R \$(whoami):\$(whoami) $APP_DIR;
  else
    echo 'Pulling latest from GitHub...';
    (cd $APP_DIR && git fetch origin && git reset --hard origin/main);
  fi;
  cd $APP_DIR && bash $SCRIPT deploy;
"

if command -v sshpass &>/dev/null; then
  sshpass -p "$NISAPOTI_SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -o RequestTTY=no "$USER@$HOST" "$RUN"
else
  echo "Install sshpass (e.g. brew install sshpass) or run manually:"
  echo "  ssh $USER@$HOST"
  echo "  cd $APP_DIR && bash $SCRIPT deploy"
  exit 1
fi
