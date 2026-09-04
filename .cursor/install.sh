#!/usr/bin/env bash
# Idempotent bootstrap for the TON DNS TXT repository.
# Prepares: Express API proxy (server), React/Vite frontend (client),
# and two Python Telegram bots (bot, null-order/bot).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# The default image ships Python 3.12 but not the venv module the bots need.
if ! python3 -c 'import ensurepip' >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq python3.12-venv
fi

setup_python_bot() {
  local dir="$1"
  ( cd "$dir"
    [ -f .env ] || { [ -f .env.example ] && cp .env.example .env; }
    python3 -m venv venv
    ./venv/bin/pip install --quiet --upgrade pip
    ./venv/bin/pip install --quiet -r requirements.txt
  )
}

# Backend API proxy (Express + TypeScript) — build so `node dist/index.js` is ready.
( cd server
  [ -f .env ] || cp .env.example .env
  npm install
  npm run build
)

# Frontend (React + Vite + TypeScript).
( cd client
  [ -f .env ] || cp .env.example .env
  npm install
)

# Telegram bots (require BOT_TOKEN at runtime; deps installed into per-bot venvs).
setup_python_bot bot
setup_python_bot null-order/bot

echo "install.sh complete"
