#!/usr/bin/env bash
# 连接 iPhone（WiFi 网络模式 — 云环境无法 USB，用此方式接上）
#
# 手机端准备：
#   1. 越狱 + Cydia 安装 OpenSSH、frida-server
#   2. 手机与电脑同一 WiFi（或手机热点给电脑连）
#   3. 设置 → WiFi → 点击已连网络 → 查看 IP（如 192.168.1.108）
#   4. 修改下方 config.env 填入 DEVICE_IP
#
# Usage:
#   ./connect.sh              # 测试连接
#   ./connect.sh 192.168.1.108  # 临时指定 IP
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$SCRIPT_DIR/config.env"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# shellcheck disable=SC1090
[ -f "$CONFIG" ] && source "$CONFIG"

DEVICE_IP="${1:-${DEVICE_IP:-}}"
SSH_PORT="${SSH_PORT:-22}"
SSH_USER="${SSH_USER:-root}"
SSH_PASS="${SSH_PASS:-alpine}"
FRIDA_PORT="${FRIDA_PORT:-27042}"

if [ -z "$DEVICE_IP" ]; then
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  破甲 · 设备连接向导                                     ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "云环境无法 USB 直连 iPhone，请用 WiFi 网络连接："
  echo ""
  echo "  ① 手机：设置 → WiFi → 查看 IP 地址"
  echo "  ② 编辑 config.env："
  echo "       DEVICE_IP=192.168.x.x"
  echo "  ③ 重新运行："
  echo "       ./connect.sh"
  echo "       bash pojia.sh"
  echo ""
  echo "手机端需已安装：OpenSSH + frida-server（与主机 Frida 版本一致）"
  exit 1
fi

# Save IP to config if passed as argument
if [ -n "${1:-}" ]; then
  if grep -q '^DEVICE_IP=' "$CONFIG" 2>/dev/null; then
    sed -i "s/^DEVICE_IP=.*/DEVICE_IP=$DEVICE_IP/" "$CONFIG"
  else
    echo "DEVICE_IP=$DEVICE_IP" >> "$CONFIG"
  fi
  echo "[connect] 已保存 DEVICE_IP=$DEVICE_IP → config.env"
fi

log() { echo "[connect] $*"; }

echo ""
echo "════════════════════════════════════════"
echo "  连接测试 → $DEVICE_IP"
echo "════════════════════════════════════════"

# ── 1. Ping ──────────────────────────────────────────────────────────────────
if ping -c 1 -W 3 "$DEVICE_IP" >/dev/null 2>&1; then
  log "✅ Ping 可达"
else
  log "❌ Ping 失败 — 检查是否同一 WiFi / 防火墙"
  log "   提示：云 VM 通常无法访问你家里的局域网 IP"
  log "   若你在本地电脑运行，请 clone 仓库到本地执行"
fi

# ── 2. SSH ───────────────────────────────────────────────────────────────────
SSH_OK=0
if timeout 5 bash -c "echo >/dev/tcp/$DEVICE_IP/$SSH_PORT" 2>/dev/null; then
  log "✅ SSH 端口 $SSH_PORT 开放"
  SSH_OK=1
else
  log "❌ SSH 端口 $SSH_PORT 不可达"
fi

# ── 3. Frida ─────────────────────────────────────────────────────────────────
FRIDA_OK=0
if timeout 5 bash -c "echo >/dev/tcp/$DEVICE_IP/$FRIDA_PORT" 2>/dev/null; then
  log "✅ Frida 端口 $FRIDA_PORT 开放"
  FRIDA_OK=1
else
  log "❌ Frida 端口 $FRIDA_PORT 不可达 — 手机上运行: frida-server -l 0.0.0.0:$FRIDA_PORT"
fi

# ── 4. Frida remote list ─────────────────────────────────────────────────────
# shellcheck disable=SC1091
source "$REPO_ROOT/ios-re/venv/bin/activate" 2>/dev/null || true
if [ "$FRIDA_OK" -eq 1 ] && command -v frida >/dev/null; then
  if PROCS=$(timeout 10 frida-ps -H "$DEVICE_IP:$FRIDA_PORT" 2>/dev/null | head -5); then
    log "✅ Frida 远程连接成功"
    echo "$PROCS" | sed 's/^/    /'
  else
    log "⚠️  Frida 端口开放但握手失败 — 检查 frida-server 版本"
  fi
fi

# ── 5. SSH probe ─────────────────────────────────────────────────────────────
if [ "$SSH_OK" -eq 1 ]; then
  if command -v sshpass >/dev/null 2>&1; then
    if sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 \
        -p "$SSH_PORT" "$SSH_USER@$DEVICE_IP" "uname -a; frida-server --version 2>/dev/null || echo 'frida-server not in PATH'" 2>/dev/null; then
      log "✅ SSH 登录成功"
    else
      log "⚠️  SSH 端口开放但登录失败 — 默认密码 alpine，建议修改"
    fi
  else
    log "ℹ️  安装 sshpass 可自动 SSH 测试: sudo apt install sshpass"
    log "   手动测试: ssh -p $SSH_PORT $SSH_USER@$DEVICE_IP"
  fi
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
CONNECTED=0
[ "$FRIDA_OK" -eq 1 ] && CONNECTED=1

if [ "$CONNECTED" -eq 1 ]; then
  echo "  状态: ✅ 已接上 — 可执行实弹破甲"
  echo ""
  echo "  bash pojia.sh"
  echo "  或: ./armor_break.sh --host $DEVICE_IP -t App -b com.bundle"
else
  echo "  状态: ❌ 未接上"
  echo ""
  echo "  云 VM 限制：无法访问你家 WiFi 里的 192.168.x.x"
  echo "  解决方案："
  echo "    A) 在本地 Linux/Mac  clone 仓库运行 bash pojia.sh"
  echo "    B) 手机开热点 → 电脑连热点 → 填新 IP → ./connect.sh"
  echo "    C) 用 ngrok/frp 将手机 SSH 端口暴露到公网（高级）"
fi
echo "════════════════════════════════════════"

# Write connection status to data
mkdir -p "$SCRIPT_DIR/data"
python3 - <<PYEOF
import json, datetime
status = {
    "device_ip": "$DEVICE_IP",
    "checked_at": datetime.datetime.now().isoformat(),
    "ssh_port_open": $SSH_OK == 1,
    "frida_port_open": $FRIDA_OK == 1,
    "connected": $CONNECTED == 1,
}
with open("$SCRIPT_DIR/data/connection.json", "w") as f:
    json.dump(status, f, indent=2)
PYEOF

exit $((1 - CONNECTED))
