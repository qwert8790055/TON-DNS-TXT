#!/usr/bin/env bash
# Run this on your Mac to upload skill reference files to the server.
# Usage: ./scripts/upload-skills-to-server.sh /path/to/机密

set -euo pipefail

SERVER="root@135.181.228.18"
SRC="${1:-$HOME/Downloads/机密}"

if [[ ! -d "$SRC" ]]; then
  echo "Error: directory not found: $SRC"
  echo "Usage: $0 /path/to/机密"
  exit 1
fi

echo "==> Uploading from: $SRC"
echo "==> Server: $SERVER"
echo ""

# PDFs
if compgen -G "$SRC/*.pdf" > /dev/null; then
  echo "Uploading PDFs..."
  scp "$SRC"/*.pdf "$SERVER:/var/www/skills-upload/pdfs/"
fi

# Spreadsheets / docs
for ext in xlsx xls doc docx txt md; do
  if compgen -G "$SRC/*.$ext" > /dev/null; then
    echo "Uploading .$ext files..."
    scp "$SRC"/*."$ext" "$SERVER:/var/www/skills-upload/jimi/"
  fi
done

# Scripts (unzipped folders)
for dir in "$SRC"/*基线* "$SRC"/*baseline* "$SRC"/scripts; do
  if [[ -d "$dir" ]]; then
    echo "Uploading scripts from $(basename "$dir")..."
    scp -r "$dir"/* "$SERVER:/var/www/skills-upload/scripts/" 2>/dev/null || true
  fi
done

echo ""
echo "==> Verifying on server..."
ssh "$SERVER" 'find /var/www/skills-upload -type f ! -name README.txt -exec ls -lh {} \;'

echo ""
echo "Done! Go back to Cursor and say: 服务器已上传"
