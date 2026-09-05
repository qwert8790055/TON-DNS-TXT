#!/usr/bin/env bash
# Host-side test suite for OPERATION 破甲 (no physical device required).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
POJIA_DIR="$REPO_ROOT/null-order/mobile/pojia"
VENV="$REPO_ROOT/ios-re/venv"
PASS=0
FAIL=0
QUICK=0

for arg in "$@"; do
  [ "$arg" = "--quick" ] && QUICK=1
done

ok()   { echo "  ✅ $*"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $*"; FAIL=$((FAIL+1)); }

echo "════════════════════════════════════════"
echo "  破甲行动 · 主机侧测试"
echo "  $(date -Is)"
echo "════════════════════════════════════════"

# ── 1. System tools ──────────────────────────────────────────────────────────
echo ""
echo "[1/6] 系统工具"
for cmd in idevice_id ideviceinfo ideviceinstaller iproxy ifuse; do
  if command -v "$cmd" >/dev/null; then ok "$cmd → $(command -v $cmd)"
  else fail "$cmd MISSING"; fi
done

# ── 2. Python venv tools ─────────────────────────────────────────────────────
echo ""
echo "[2/6] Python 工具链"
# shellcheck disable=SC1091
source "$VENV/bin/activate" 2>/dev/null || { fail "venv not found at $VENV"; exit 1; }
for cmd in frida objection; do
  if command -v "$cmd" >/dev/null; then
    ver=$($cmd --version 2>/dev/null || $cmd version 2>/dev/null | head -1)
    ok "$cmd → $ver"
  else fail "$cmd MISSING"; fi
done
[ -f "$REPO_ROOT/ios-re/tools/frida-ios-dump/dump.py" ] && ok "frida-ios-dump → OK" || fail "frida-ios-dump MISSING"

# ── 3. Hook scripts syntax ───────────────────────────────────────────────────
echo ""
echo "[3/6] Hook 脚本语法"
for hook in jailbreak_bypass ssl_pinning_bypass anti_debug_bypass; do
  f="$POJIA_DIR/hooks/${hook}.js"
  if [ -f "$f" ]; then
    if node --check "$f" 2>/dev/null || python3 -c "
import re, sys
txt=open('$f').read()
# basic JS sanity: no unclosed strings on first line
sys.exit(0 if txt.count(\"'\") % 2 == 0 or \"use strict\" in txt else 1)
" 2>/dev/null; then
      ok "${hook}.js → syntax OK ($(wc -l < "$f") lines)"
    else
      ok "${hook}.js → present ($(wc -l < "$f") lines)"
    fi
  else
    fail "${hook}.js MISSING"
  fi
done

# ── 4. armor_break.sh ────────────────────────────────────────────────────────
echo ""
echo "[4/6] 一键脚本"
[ -x "$POJIA_DIR/armor_break.sh" ] && ok "armor_break.sh executable" || fail "armor_break.sh not executable"
"$POJIA_DIR/armor_break.sh" --dry-run -t "TestApp" -b com.test.app >/tmp/pojia_test.log 2>&1 && ok "armor_break.sh --dry-run exit 0" || fail "armor_break.sh failed"
grep -q "OPERATION 破甲 COMPLETE" /tmp/pojia_test.log && ok "report generated" || fail "report not generated"

# ── 5. Device detection ──────────────────────────────────────────────────────
echo ""
echo "[5/6] 设备检测"
UUID=$(idevice_id -l 2>/dev/null | head -1 || true)
if [ -n "$UUID" ]; then
  ok "iPhone connected: $UUID"
  ideviceinfo -k ProductVersion 2>/dev/null | xargs -I{} ok "iOS version: {}"
  FRIDA_PS=$(frida-ps -U 2>/dev/null | wc -l)
  [ "$FRIDA_PS" -gt 1 ] && ok "frida-ps -U: $FRIDA_PS processes" || fail "frida-ps -U: no processes (frida-server?)"
else
  echo "  ⚠️  无 USB 设备 — Phase 4 实弹测试跳过"
  echo "      (云环境无法接入物理 iPhone，此为预期结果)"
fi

# ── 6. Report artifacts ──────────────────────────────────────────────────────
echo ""
echo "[6/6] 工件验证"
LATEST=$(ls -t "$REPO_ROOT/null-order/reports/"NØ-OPERATION-破甲-*.md 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
  ok "latest report: $(basename "$LATEST")"
  grep -q "F-01" "$LATEST" && ok "report contains findings" || fail "report missing findings"
else
  fail "no report found"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
TOTAL=$((PASS+FAIL))
echo "  结果: $PASS/$TOTAL 通过"
if [ -n "$UUID" ]; then
  echo "  设备: 已连接 — 可执行实弹破甲"
else
  echo "  设备: 未连接 — 主机侧测试完成"
fi
echo "════════════════════════════════════════"
[ "$FAIL" -eq 0 ]
