#!/usr/bin/env bash
# Sync skill reference files from server upload directory to local skill package.
# Run after uploading files to /var/www/skills-upload/ on the server.

set -euo pipefail

SERVER="${SKILLS_SERVER:-root@135.181.228.18}"
REMOTE_DIR="/var/www/skills-upload"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/.cursor/skills/jimi/references/uploaded"

echo "==> Syncing from $SERVER:$REMOTE_DIR"
mkdir -p "$LOCAL_DIR/pdfs" "$LOCAL_DIR/jimi" "$LOCAL_DIR/scripts"

rsync -avz --progress \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$SERVER:$REMOTE_DIR/pdfs/" "$LOCAL_DIR/pdfs/" \
  2>/dev/null || scp -r "$SERVER:$REMOTE_DIR/pdfs/*" "$LOCAL_DIR/pdfs/" 2>/dev/null || true

rsync -avz --progress \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$SERVER:$REMOTE_DIR/jimi/" "$LOCAL_DIR/jimi/" \
  2>/dev/null || scp -r "$SERVER:$REMOTE_DIR/jimi/*" "$LOCAL_DIR/jimi/" 2>/dev/null || true

rsync -avz --progress \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$SERVER:$REMOTE_DIR/scripts/" "$LOCAL_DIR/scripts/" \
  2>/dev/null || scp -r "$SERVER:$REMOTE_DIR/scripts/*" "$LOCAL_DIR/scripts/" 2>/dev/null || true

echo ""
echo "==> Synced files:"
find "$LOCAL_DIR" -type f ! -name '.gitkeep' | sort || echo "(none yet — upload files to server first)"
echo ""
echo "Done. Update SKILL.md index if new files were added."
