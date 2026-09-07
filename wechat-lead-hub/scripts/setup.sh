#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> WeChat Lead Hub - Setup"
echo ""

if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "Created server/.env from example"
fi

echo "==> Installing dependencies..."
npm run install:all

echo "==> Building..."
npm run build

echo ""
echo "Setup complete!"
echo ""
echo "  Start server:  npm start"
echo "  Dev (server):  npm run dev:server"
echo "  Dev (web):     npm run dev:web"
echo "  Docker:        npm run docker:up"
echo ""
echo "  Admin:  http://localhost:4780/admin"
echo "  Login:  admin / admin123"
echo ""
