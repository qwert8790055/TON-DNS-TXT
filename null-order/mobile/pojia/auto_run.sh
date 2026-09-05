#!/usr/bin/env bash
# 破甲行动 · 自动执行 + 数据保存
#
# Usage:
#   ./auto_run.sh                    # 自动检测 → 执行 → 保存
#   ./auto_run.sh -t App -b com.app  # 指定目标
#   ./auto_run.sh --watch 60         # 每 60 秒轮询设备并重跑
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_NAME=""
TARGET_BUNDLE=""
WATCH_INTERVAL=0

# Load config.env if present
CONFIG="$SCRIPT_DIR/config.env"
if [ -f "$CONFIG" ]; then
  # shellcheck disable=SC1090
  source "$CONFIG"
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t) TARGET_NAME="$2"; shift 2 ;;
    -b) TARGET_BUNDLE="$2"; shift 2 ;;
    --watch) WATCH_INTERVAL="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [-t AppName] [-b bundle.id] [--watch SECONDS]"
      exit 0 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

run_once() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  破甲自动运行  $(date '+%Y-%m-%d %H:%M:%S')                       ║"
  echo "╚══════════════════════════════════════════════════════════╝"

  # Detect device: USB first, then WiFi (config.env DEVICE_IP)
  UUID=$(idevice_id -l 2>/dev/null | head -1 || true)
  DEVICE_HOST="${DEVICE_IP:-}"

  if [ -n "$UUID" ]; then
    echo "[auto] USB 设备已连接: $UUID"
    ARGS=()
    [ -n "$TARGET_NAME" ] && ARGS+=(-t "$TARGET_NAME")
    [ -n "$TARGET_BUNDLE" ] && ARGS+=(-b "$TARGET_BUNDLE")
    "$SCRIPT_DIR/armor_break.sh" "${ARGS[@]}"
  elif [ -n "$DEVICE_HOST" ]; then
    echo "[auto] WiFi 模式 → $DEVICE_HOST"
    if "$SCRIPT_DIR/connect.sh" "$DEVICE_HOST"; then
      ARGS=(--host "$DEVICE_HOST")
      [ -n "$TARGET_NAME" ] && ARGS+=(-t "$TARGET_NAME")
      [ -n "$TARGET_BUNDLE" ] && ARGS+=(-b "$TARGET_BUNDLE")
      "$SCRIPT_DIR/armor_break.sh" "${ARGS[@]}"
    else
      echo "[auto] WiFi 连接失败 — 离线模式"
      ARGS=(--dry-run)
      [ -n "$TARGET_NAME" ] && ARGS+=(-t "$TARGET_NAME")
      [ -n "$TARGET_BUNDLE" ] && ARGS+=(-b "$TARGET_BUNDLE")
      "$SCRIPT_DIR/armor_break.sh" "${ARGS[@]}"
    fi
  else
    echo "[auto] 无设备 — 离线模式（填入 config.env DEVICE_IP 可 WiFi 接上）"
    ARGS=(--dry-run)
    [ -n "$TARGET_NAME" ] && ARGS+=(-t "$TARGET_NAME")
    [ -n "$TARGET_BUNDLE" ] && ARGS+=(-b "$TARGET_BUNDLE")
    "$SCRIPT_DIR/armor_break.sh" "${ARGS[@]}"
  fi

  # armor_break.sh already calls save_data.sh at end
  # Extract operation ID for summary
  LATEST_REPORT=$(ls -t "$SCRIPT_DIR/../../reports"/NØ-OPERATION-破甲-POJIA-*.md 2>/dev/null | head -1)
  OP_ID=$(basename "$LATEST_REPORT" .md | sed 's/NØ-OPERATION-破甲-//')

  # Run host tests (skip armor_break dry-run to avoid duplicate ops)
  echo "[auto] 运行主机测试..."
  bash "$SCRIPT_DIR/test_host.sh" --quick > "$SCRIPT_DIR/data/latest/test_result.log" 2>&1 || true

  echo ""
  echo "[auto] 数据已保存至: $SCRIPT_DIR/data/"
  cat "$SCRIPT_DIR/data/index.json" 2>/dev/null | python3 -m json.tool 2>/dev/null | head -20 || true
}

if [ "$WATCH_INTERVAL" -gt 0 ]; then
  echo "[auto] 监视模式: 每 ${WATCH_INTERVAL}s 检测并重跑"
  while true; do
    run_once
    sleep "$WATCH_INTERVAL"
  done
else
  run_once
fi
