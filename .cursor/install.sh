#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the TON DNS TXT project.
# Prepares the Express API proxy, the React/Vite client, and both Telegram bots.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# System dependency: the venv module (with ensurepip) is required to build the
# Python virtualenvs for the Telegram bots. The default image ships CPython but
# not the venv package on Debian/Ubuntu.
if ! python3 -c "import ensurepip" >/dev/null 2>&1; then
  echo "==> Installing python3-venv"
  sudo apt-get update -qq
  sudo apt-get install -y -qq python3.12-venv
fi

# --- Backend: Express API proxy (TypeScript -> dist/) ---
echo "==> server: install + build"
( cd server
  [ -f .env ] || cp .env.example .env
  npm install
  npm run build
)

# --- Frontend: React + Vite + TonConnect ---
echo "==> client: install"
( cd client
  [ -f .env ] || cp .env.example .env
  npm install
)

# --- Telegram bots (Python) ---
setup_bot() {
  local dir="$1"
  echo "==> ${dir}: venv + pip install"
  ( cd "$dir"
    [ -f .env ] || cp .env.example .env
    python3 -m venv venv
    ./venv/bin/pip install --upgrade pip >/dev/null
    ./venv/bin/pip install -r requirements.txt
  )
}
setup_bot bot
setup_bot null-order/bot

echo "==> Install complete."
