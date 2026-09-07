#!/usr/bin/env bash
# One-click: Mac upload → server process → ready for Cursor sync
# Usage: bash scripts/one-click-skills.sh [文件夹路径]
#
# Mac 一键命令（在终端复制粘贴）:
#   cd ~/TON-DNS-TXT && bash scripts/one-click-skills.sh ~/Downloads/机密

set -euo pipefail

SERVER="root@135.181.228.18"
SRC="${1:-$HOME/Downloads/机密}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "╔══════════════════════════════════════════╗"
echo "║   技能包一键上传 + 自动处理              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

if [[ ! -d "$SRC" ]]; then
  echo "❌ 文件夹不存在: $SRC"
  echo ""
  echo "用法: bash scripts/one-click-skills.sh /path/to/机密"
  echo "示例: bash scripts/one-click-skills.sh ~/Downloads/机密"
  exit 1
fi

echo "📁 来源: $SRC"
echo "🖥️  服务器: $SERVER"
echo ""

uploaded=0

# PDF
if compgen -G "$SRC"/*.pdf > /dev/null 2>&1; then
  echo "⬆️  上传 PDF..."
  scp -o StrictHostKeyChecking=no "$SRC"/*.pdf "$SERVER:/var/www/skills-upload/pdfs/" && uploaded=1
fi

# Office / docs
for ext in xlsx xls doc docx txt md; do
  if compgen -G "$SRC"/*."$ext" > /dev/null 2>&1; then
    echo "⬆️  上传 .$ext..."
    scp -o StrictHostKeyChecking=no "$SRC"/*."$ext" "$SERVER:/var/www/skills-upload/jimi/" && uploaded=1
  fi
done

# Scripts from unzipped dirs
for dir in "$SRC"/*; do
  [[ -d "$dir" ]] || continue
  base=$(basename "$dir")
  if [[ "$base" == *基线* ]] || [[ "$base" == *baseline* ]] || [[ "$base" == scripts ]]; then
    echo "⬆️  上传脚本目录: $base"
    scp -o StrictHostKeyChecking=no -r "$dir"/* "$SERVER:/var/www/skills-upload/scripts/" 2>/dev/null && uploaded=1 || true
  fi
done

if [[ "$uploaded" -eq 0 ]]; then
  echo "❌ 未找到可上传的文件（pdf/xlsx/脚本目录）"
  echo "   请确认路径: ls -lh \"$SRC\""
  exit 1
fi

echo ""
echo "⚙️  服务器自动处理索引..."
ssh -o StrictHostKeyChecking=no "$SERVER" 'bash /var/www/skills-upload/process.sh'

echo ""
echo "✅ 验证服务器文件:"
ssh -o StrictHostKeyChecking=no "$SERVER" 'find /var/www/skills-upload -type f ! -name README.txt -exec ls -lh {} \;'

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ 上传完成！                            ║"
echo "║  回到 Cursor 说: 服务器已上传             ║"
echo "║  Agent 会自动同步到技能包                 ║"
echo "╚══════════════════════════════════════════╝"
