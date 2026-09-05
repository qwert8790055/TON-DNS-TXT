#!/usr/bin/env bash
# Idempotent bootstrap for the TON DNS TXT dev environment.
# Installs dependencies for the Express API proxy (server), the React/Vite
# frontend (client), and the optional Telegram bot (bot).
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- System packages: python venv support for the Telegram bot ---
# The default image ships python3 without the venv/ensurepip module.
if ! python3 -c 'import ensurepip' >/dev/null 2>&1; then
  sudo -n apt-get update -qq
  sudo -n apt-get install -y -qq python3-venv
fi

# --- Backend API proxy (Express + TypeScript) ---
cd "$repo_root/server"
[ -f .env ] || cp .env.example .env
npm install
npx tsc

# --- Frontend (React + Vite) ---
cd "$repo_root/client"
[ -f .env ] || cp .env.example .env
npm install

# --- Telegram bot (optional; needs BOT_TOKEN to actually run) ---
cd "$repo_root/bot"
[ -f .env ] || cp .env.example .env
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# --- iOS reverse-engineering toolchain (optional; see ios-re/README.md) ---
bash "$repo_root/.cursor/ios-re-install.sh"

echo "install.sh completed"
