#!/usr/bin/env bash
# Mac 终极一键：无需克隆仓库，直接从 GitHub 拉脚本并上传
# 复制这一条到 Mac 终端运行：
#
#   curl -fsSL "https://raw.githubusercontent.com/qwert8790055/TON-DNS-TXT/master/scripts/mac-one-liner.sh" | bash -s ~/Downloads/机密

set -euo pipefail
SRC="${1:-$HOME/Downloads/机密}"
SERVER="root@135.181.228.18"
REPO="https://raw.githubusercontent.com/qwert8790055/TON-DNS-TXT/master/scripts"

echo "==> 下载上传脚本..."
TMP=$(mktemp -d)
curl -fsSL "$REPO/upload-skills-to-server.sh" -o "$TMP/upload.sh"
chmod +x "$TMP/upload.sh"

echo "==> 开始上传..."
bash "$TMP/upload.sh" "$SRC"

echo "==> 服务器整理文件..."
ssh -o StrictHostKeyChecking=no "$SERVER" 'bash /var/www/skills-upload/receive.sh 2>/dev/null; bash /var/www/skills-upload/process.sh'

echo ""
echo "✅ 完成！回到 Cursor 说: 服务器已上传"
rm -rf "$TMP"
