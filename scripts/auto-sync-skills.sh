#!/usr/bin/env bash
# Auto-sync uploaded skill files from server → repo + update SKILL.md index
set -euo pipefail

SERVER="${SKILLS_SERVER:-root@135.181.228.18}"
REMOTE_DIR="/var/www/skills-upload"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_DIR="$REPO_ROOT/.cursor/skills/jimi/references/uploaded"
SKILL_MD="$REPO_ROOT/.cursor/skills/jimi/SKILL.md"

export SSHPASS="${SSHPASS:-TeGQZZHIpLyES0f1}"

ssh_cmd() {
  if command -v sshpass >/dev/null && [[ -n "${SSHPASS:-}" ]]; then
    sshpass -e ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
  else
    ssh -o StrictHostKeyChecking=no "$SERVER" "$@"
  fi
}

scp_cmd() {
  if command -v sshpass >/dev/null && [[ -n "${SSHPASS:-}" ]]; then
    sshpass -e scp -o StrictHostKeyChecking=no "$@"
  else
    scp -o StrictHostKeyChecking=no "$@"
  fi
}

echo "==> [1/4] Run server index processor"
ssh_cmd 'bash /var/www/skills-upload/process.sh' 2>/dev/null || true

echo "==> [2/4] Pull files from server"
mkdir -p "$LOCAL_DIR/pdfs" "$LOCAL_DIR/jimi" "$LOCAL_DIR/scripts"
for sub in pdfs jimi scripts; do
  scp_cmd -r "$SERVER:$REMOTE_DIR/$sub/." "$LOCAL_DIR/$sub/" 2>/dev/null || true
done
scp_cmd "$SERVER:$REMOTE_DIR/INDEX.json" "$LOCAL_DIR/INDEX.json" 2>/dev/null || true

echo "==> [3/4] List synced files"
mapfile -t FILES < <(find "$LOCAL_DIR" -type f ! -name '.gitkeep' ! -name 'INDEX.json' 2>/dev/null | sort)
COUNT=${#FILES[@]}

if [[ "$COUNT" -eq 0 ]]; then
  echo "❌ 服务器上没有文件。请在 Mac 运行:"
  echo "   bash scripts/one-click-skills.sh ~/Downloads/机密"
  exit 1
fi

printf '%s\n' "${FILES[@]}"
echo "Total: $COUNT file(s)"

echo "==> [4/4] Update SKILL.md index"
TABLE_FILE=$(mktemp)
echo '| 文件 | 名称 | 用途 |' > "$TABLE_FILE"
echo '|------|------|------|' >> "$TABLE_FILE"
for f in "${FILES[@]}"; do
  rel="${f#$LOCAL_DIR/}"
  name=$(basename "$f")
  case "$rel" in
    pdfs/*)   purpose="PDF 参考文档" ;;
    jimi/*)   purpose="机密文档/表格" ;;
    scripts/*) purpose="基线检查脚本" ;;
    *)        purpose="参考文件" ;;
  esac
  echo "| \`uploaded/${rel}\` | ${name} | ${purpose} |" >> "$TABLE_FILE"
done

SYNC_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
BLOCK_FILE=$(mktemp)
{
  echo "## 已上传参考文件（自动同步）"
  echo ""
  cat "$TABLE_FILE"
  echo ""
  echo "> 同步时间: ${SYNC_TIME}"
  echo ""
} > "$BLOCK_FILE"

python3 - "$SKILL_MD" "$BLOCK_FILE" << 'PY'
import re, sys
from pathlib import Path

skill = Path(sys.argv[1])
block = Path(sys.argv[2]).read_text()
text = skill.read_text()
marker = "## 已上传参考文件（自动同步）"
if marker in text:
    text = re.sub(r'## 已上传参考文件（自动同步）.*?(?=\n## |\Z)', block.rstrip() + '\n\n', text, flags=re.S)
else:
    text = text.rstrip() + '\n\n' + block
skill.write_text(text)
print("Updated SKILL.md")
PY

rm -f "$TABLE_FILE" "$BLOCK_FILE"
echo "✅ Auto-sync complete ($COUNT files)"
