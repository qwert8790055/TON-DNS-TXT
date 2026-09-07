#!/usr/bin/env bash
# Server-side: index uploaded skill files and write manifest.
set -euo pipefail

BASE="/var/www/skills-upload"
MANIFEST="$BASE/INDEX.json"
TMP="$(mktemp)"

echo "==> Processing uploads in $BASE"

count=0
echo '{"updated":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","files":[' > "$TMP"

first=true
while IFS= read -r -d '' f; do
  rel="${f#$BASE/}"
  size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
  name=$(basename "$f")
  $first || echo ',' >> "$TMP"
  first=false
  printf '{"path":"%s","name":"%s","size":%s}' "$rel" "$name" "$size" >> "$TMP"
  count=$((count + 1))
  echo "  + $rel ($size bytes)"
done < <(find "$BASE" -type f ! -name 'README.txt' ! -name 'INDEX.json' ! -name 'process.sh' -print0 2>/dev/null)

echo ']}' >> "$TMP"
mv "$TMP" "$MANIFEST"

echo "==> Indexed $count file(s) → $MANIFEST"
cat "$MANIFEST"
