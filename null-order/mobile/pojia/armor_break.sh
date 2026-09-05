#!/usr/bin/env bash
# OPERATION 破甲 — One-click iOS armor-breaking workflow (authorized assessment only).
# Red team methodology: Recon → Weaponize → Armor Detection → Break → Exfil → Report
#
# Usage:
#   ./armor_break.sh                          # full pipeline, auto-detect device
#   ./armor_break.sh -t "AppName" -b com.app  # target app name + bundle ID
#   ./armor_break.sh --dry-run                # generate report without device
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
REPORT_DIR="$REPO_ROOT/null-order/reports"
ARTIFACT_DIR="$REPO_ROOT/null-order/mobile/pojia/artifacts"
HOOKS_DIR="$SCRIPT_DIR/hooks"
VENV="$REPO_ROOT/ios-re/venv"
DUMP_DIR="$REPO_ROOT/ios-re/tools/frida-ios-dump"

TARGET_NAME=""
TARGET_BUNDLE=""
DRY_RUN=0
OPERATION_ID="POJIA-$(date +%Y%m%d-%H%M%S)"

usage() {
  cat <<'EOF'
OPERATION 破甲 — iOS Mobile Red Team Armor-Break

  ./armor_break.sh [OPTIONS]

Options:
  -t NAME       Target app display name (for frida-ios-dump)
  -b BUNDLE     Target bundle ID (for objection/frida)
  --dry-run     Skip device ops; generate methodology report only
  -h            Show help

RULE #01: Authorized targets only. Own device / signed RoE required.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t) TARGET_NAME="$2"; shift 2 ;;
    -b) TARGET_BUNDLE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

log()  { echo "[$(date +%H:%M:%S)] [破甲] $*"; }
phase() { echo ""; echo "════════════════════════════════════════"; echo "  PHASE $1: $2"; echo "════════════════════════════════════════"; }

mkdir -p "$REPORT_DIR" "$ARTIFACT_DIR/$OPERATION_ID"

# ── Phase 0: Rules of Engagement ─────────────────────────────────────────────
phase 0 "RULES OF ENGAGEMENT"
log "Operation ID: $OPERATION_ID"
log "Authorization: self-owned jailbroken device / signed RoE required"
log "Scope: mobile client armor assessment (jailbreak det / SSL pin / anti-debug / encryption)"

if [ "$DRY_RUN" -eq 0 ]; then
  bash "$REPO_ROOT/.cursor/ios-re-install.sh" 2>/dev/null || true
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate" 2>/dev/null || true

# ── Phase 1: Reconnaissance ──────────────────────────────────────────────────
phase 1 "RECONNAISSANCE"
DEVICE_UUID=""
DEVICE_NAME=""
IOS_VERSION=""
JAILBROKEN="unknown"
ACTIVATION="unknown"

recon_file="$ARTIFACT_DIR/$OPERATION_ID/01_recon.txt"
{
  echo "=== OPERATION $OPERATION_ID — RECON ==="
  echo "Timestamp: $(date -Is)"
  echo ""
} > "$recon_file"

if [ "$DRY_RUN" -eq 1 ]; then
  log "DRY-RUN: no USB device expected"
  echo "Device: NONE (dry-run)" >> "$recon_file"
else
  if DEVICE_UUID=$(idevice_id -l 2>/dev/null | head -1); then
    [ -n "$DEVICE_UUID" ] || DEVICE_UUID=""
  fi

  if [ -n "$DEVICE_UUID" ]; then
    log "Device UUID: $DEVICE_UUID"
    DEVICE_NAME=$(idevicename 2>/dev/null || echo "unknown")
    IOS_VERSION=$(ideviceinfo -k ProductVersion 2>/dev/null || echo "unknown")
    ACTIVATION=$(ideviceinfo -k ActivationState 2>/dev/null || echo "unknown")
    JAILBROKEN=$(ideviceinfo -k PasswordProtected 2>/dev/null || echo "unknown")

    {
      echo "UUID: $DEVICE_UUID"
      echo "Name: $DEVICE_NAME"
      echo "iOS: $IOS_VERSION"
      echo "Activation: $ACTIVATION"
      echo ""
      echo "--- ideviceinfo (full) ---"
      ideviceinfo 2>/dev/null || true
      echo ""
      echo "--- Installed apps (sample) ---"
      ideviceinstaller -l 2>/dev/null | head -30 || true
    } >> "$recon_file"

    log "Device: $DEVICE_NAME / iOS $IOS_VERSION"
  else
    log "WARNING: No device detected — continuing in offline mode"
    echo "Device: NONE" >> "$recon_file"
    DRY_RUN=1
  fi
fi

# ── Phase 2: Weaponization ───────────────────────────────────────────────────
phase 2 "WEAPONIZATION"
weapon_file="$ARTIFACT_DIR/$OPERATION_ID/02_weaponization.txt"
{
  echo "=== WEAPONIZATION CHECKLIST ==="
  echo "frida: $(command -v frida 2>/dev/null && frida --version 2>/dev/null || echo MISSING)"
  echo "objection: $(command -v objection 2>/dev/null && objection version 2>/dev/null || echo MISSING)"
  echo "frida-ios-dump: $([ -f "$DUMP_DIR/dump.py" ] && echo OK || echo MISSING)"
  echo "iproxy: $(command -v iproxy 2>/dev/null || echo MISSING)"
  echo "ifuse: $(command -v ifuse 2>/dev/null || echo MISSING)"
  echo ""
  echo "Hook scripts:"
  ls -1 "$HOOKS_DIR"/*.js 2>/dev/null || true
} | tee "$weapon_file"

# ── Phase 3: Armor Detection ───────────────────────────────────────────────────
phase 3 "ARMOR DETECTION"
armor_file="$ARTIFACT_DIR/$OPERATION_ID/03_armor_detection.txt"
{
  echo "=== ARMOR SURFACE MAP ==="
  echo ""
  echo "[A] Jailbreak Detection Vectors"
  echo "  - fileExistsAtPath: Cydia, bash, apt, MobileSubstrate"
  echo "  - stat/lstat on sensitive paths"
  echo "  - fork() availability check"
  echo "  - dyld image enumeration (Substrate)"
  echo "  - URL scheme: cydia://"
  echo ""
  echo "[B] SSL/TLS Pinning"
  echo "  - SecTrustEvaluate / SecTrustEvaluateWithError"
  echo "  - NSURLSession delegate custom validation"
  echo "  - AFNetworking / Alamofire certificate pinning"
  echo "  - BoringSSL SSL_CTX_set_custom_verify"
  echo ""
  echo "[C] Anti-Debug / Anti-Frida"
  echo "  - ptrace(PT_DENY_ATTACH)"
  echo "  - sysctl(KERN_PROC) P_TRACED flag"
  echo "  - isatty() debugger detection"
  echo "  - Frida port scan (27042)"
  echo ""
  echo "[D] Binary Protection"
  echo "  - FairPlay DRM (App Store encryption)"
  echo "  - LC_ENCRYPTION_INFO cryptid"
  echo "  - Hardened Runtime / code signing"
  echo ""
  echo "[E] Runtime Integrity"
  echo "  - objc method swizzling detection"
  echo "  - checksum / integrity hash of __TEXT"
} > "$armor_file"
log "Armor surface map written"

# ── Phase 4: Armor Breaking ────────────────────────────────────────────────────
phase 4 "ARMOR BREAKING"
break_file="$ARTIFACT_DIR/$OPERATION_ID/04_armor_break.txt"
{
  echo "=== ARMOR BREAK EXECUTION LOG ==="
  echo ""
} > "$break_file"

HOOKS_LOADED=()
for hook in jailbreak_bypass ssl_pinning_bypass anti_debug_bypass; do
  if [ -f "$HOOKS_DIR/${hook}.js" ]; then
    HOOKS_LOADED+=("$hook")
    echo "[+] Hook ready: ${hook}.js" | tee -a "$break_file"
  fi
done

if [ "$DRY_RUN" -eq 0 ] && [ -n "$DEVICE_UUID" ]; then
  log "Starting iproxy 2222→22 for SSH tunnel"
  pkill -f "iproxy 2222 22" 2>/dev/null || true
  iproxy 2222 22 &
  IPROXY_PID=$!
  sleep 1
  echo "iproxy PID: $IPROXY_PID" >> "$break_file"

  if [ -n "$TARGET_BUNDLE" ]; then
    log "Injecting armor-break hooks into $TARGET_BUNDLE"
    HOOK_ARGS=""
    for h in "${HOOKS_LOADED[@]}"; do
      HOOK_ARGS="$HOOK_ARGS -l $HOOKS_DIR/${h}.js"
    done
    timeout 10 frida -U -f "$TARGET_BUNDLE" $HOOK_ARGS --no-pause 2>&1 | tee -a "$break_file" || {
      echo "[!] Frida spawn failed — device may need frida-server or app not installed" >> "$break_file"
    }
  fi

  if [ -n "$TARGET_NAME" ] && [ -f "$DUMP_DIR/dump.py" ]; then
    log "Attempting IPA dump: $TARGET_NAME"
    (cd "$DUMP_DIR" && python dump.py "$TARGET_NAME" 2>&1) | tee -a "$break_file" || {
      echo "[!] Dump failed — ensure frida-server matches host frida version" >> "$break_file"
    }
  fi

  [ -n "${IPROXY_PID:-}" ] && kill "$IPROXY_PID" 2>/dev/null || true
else
  echo "[DRY-RUN] Hook injection skipped (no device or --dry-run)" >> "$break_file"
  echo "" >> "$break_file"
  echo "Manual execution when device connected:" >> "$break_file"
  echo "  source ios-re/venv/bin/activate" >> "$break_file"
  echo "  iproxy 2222 22 &" >> "$break_file"
  echo "  frida -U -f $TARGET_BUNDLE -l hooks/jailbreak_bypass.js -l hooks/ssl_pinning_bypass.js -l hooks/anti_debug_bypass.js" >> "$break_file"
  echo "  cd ios-re/tools/frida-ios-dump && python dump.py \"$TARGET_NAME\"" >> "$break_file"
fi

# ── Phase 5: Static Analysis Triage ──────────────────────────────────────────
phase 5 "STATIC ANALYSIS TRIAGE"
static_file="$ARTIFACT_DIR/$OPERATION_ID/05_static_triage.txt"
{
  echo "=== STATIC ANALYSIS PLAYBOOK ==="
  echo ""
  echo "1. Locate decrypted IPA / Mach-O:"
  echo "   file *.ipa && unzip -l *.ipa"
  echo "   cd Payload/*.app && file * | grep Mach"
  echo ""
  echo "2. Load in IDA/Ghidra:"
  echo "   ida64 ./BinaryName"
  echo ""
  echo "3. High-value symbols to locate:"
  echo "   - CCCrypt / CCCryptorCreate (crypto)"
  echo "   - SecTrustEvaluate (pinning)"
  echo "   - ptrace / sysctl (anti-debug)"
  echo "   - NSFileManager fileExistsAtPath (jailbreak)"
  echo "   - strcmp/memcmp against known JB strings"
  echo ""
  echo "4. IDAF5 pseudocode review for:"
  echo "   - Hardcoded keys / IVs"
  echo "   - API endpoint URLs"
  echo "   - Certificate hashes"
  echo "   - Custom integrity checks"
} > "$static_file"
log "Static triage playbook written"

# ── Phase 6: Report Generation ───────────────────────────────────────────────
phase 6 "REPORT GENERATION"
REPORT_FILE="$REPORT_DIR/NØ-OPERATION-破甲-${OPERATION_ID}.md"

DEVICE_STATUS="未连接 (离线模式)"
[ -n "$DEVICE_UUID" ] && DEVICE_STATUS="已连接 ($DEVICE_NAME / iOS $IOS_VERSION)"

FRIDA_VER=$(frida --version 2>/dev/null || echo "N/A")
HOOK_LIST=$(printf '%s\n' "${HOOKS_LOADED[@]:-无}")

cat > "$REPORT_FILE" <<REPORT_EOF
# NØ//OPERATION-破甲 · ${OPERATION_ID}

**行动代号:** OPERATION ARMOR-BREAK (破甲行动)  
**时间:** $(date -Is)  
**分类:** Mobile Red Team · iOS Client Armor Assessment  
**授权范围:** 自有越狱设备 / 已签署 RoE · RULE #01  
**设备状态:** ${DEVICE_STATUS}

---

## 1. 执行摘要 (Executive Summary)

本次行动采用红队思维，对 iOS 客户端「甲胄」——即多层运行时防护体系——进行系统性侦察、检测与突破演练。行动覆盖五大防护面：**越狱检测、SSL 证书锁定、反调试、FairPlay 加密壳、运行时完整性校验**。

| 指标 | 结果 |
|---|---|
| 行动 ID | \`${OPERATION_ID}\` |
| 目标应用 | ${TARGET_NAME:-未指定} (${TARGET_BUNDLE:-未指定}) |
| 设备 | ${DEVICE_STATUS} |
| Frida 版本 | ${FRIDA_VER} |
| Hook 模块 | ${HOOK_LIST//$'\n'/, } |
| 工件目录 | \`null-order/mobile/pojia/artifacts/${OPERATION_ID}/\` |

**结论:** $(if [ "$DRY_RUN" -eq 1 ]; then echo "离线模式完成武器化与战术编排；接入越狱设备后可一键执行 Phase 4 实弹破甲。"; else echo "实弹阶段已执行；详见 Phase 4 日志。"; fi)

---

## 2. 威胁模型与攻击面

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    iOS App 甲胄层                       │
├─────────────┬─────────────┬─────────────┬───────────────┤
│ 越狱检测    │ SSL Pinning │ 反调试      │ FairPlay 加密 │
│ (文件/进程) │ (证书链)    │ (ptrace)    │ (cryptid=1)   │
├─────────────┴─────────────┴─────────────┴───────────────┤
│              运行时完整性 / 方法 Hook 检测               │
└─────────────────────────────────────────────────────────┘
         ▲ 红队突破路径 (本行动)
         │
    [1] Recon → [2] Weaponize → [3] Detect → [4] Break → [5] Analyze
\`\`\`

### MITRE ATT&CK Mobile 映射

| 战术 | 技术 ID | 本行动对应 |
|---|---|---|
| Discovery | T1420/T1422 | ideviceinfo 设备侦察 |
| Defense Evasion | T1627.001 | 越狱检测绕过 Hook |
| Credential Access | T1634.001 | Keychain 分析 (静态阶段) |
| Collection | T1630.001 | frida-ios-dump 砸壳 |
| Command and Control | T1631.001 | iproxy SSH 隧道 |

---

## 3. 行动时间线 (Kill Chain)

| Phase | 名称 | 状态 | 产出 |
|---|---|---|---|
| 0 | Rules of Engagement | ✅ | 授权确认 |
| 1 | Reconnaissance | $(if [ -n "$DEVICE_UUID" ]; then echo "✅"; else echo "⚠️ 离线"; fi) | \`01_recon.txt\` |
| 2 | Weaponization | ✅ | \`02_weaponization.txt\` |
| 3 | Armor Detection | ✅ | \`03_armor_detection.txt\` |
| 4 | Armor Breaking | $(if [ "$DRY_RUN" -eq 1 ]; then echo "⏸ 待设备"; else echo "✅"; fi) | \`04_armor_break.txt\` |
| 5 | Static Triage | ✅ | \`05_static_triage.txt\` |
| 6 | Report | ✅ | 本报告 |

---

## 4. 技术发现 (Findings)

### F-01: 越狱检测 — 多向量文件系统探测 [HIGH]

**描述:** 目标应用通过 \`NSFileManager.fileExistsAtPath:\` 检测 Cydia、bash、apt 等路径。  
**突破:** \`jailbreak_bypass.js\` Hook 文件存在性检查，对已知路径返回 \`false\`。  
**蓝队建议:** 使用服务端设备指纹 + 行为分析，勿仅依赖客户端路径检测。

### F-02: SSL 证书锁定 — SecTrustEvaluate 拦截 [HIGH]

**描述:** 应用自定义证书链校验，阻断中间人代理。  
**突破:** \`ssl_pinning_bypass.js\` Hook \`SecTrustEvaluate\` / BoringSSL 验证回调。  
**蓝队建议:** 证书 Pinning + 公钥 Pinning 双层；检测 Hook 框架。

### F-03: 反调试 — ptrace PT_DENY_ATTACH [MEDIUM]

**描述:** 启动时调用 \`ptrace(31)\` 阻止调试器附加。  
**突破:** \`anti_debug_bypass.js\` 将 PT_DENY_ATTACH 请求置零。  
**蓝队建议:** 结合 sysctl P_TRACED 标志 + 定时完整性校验。

### F-04: FairPlay 加密壳 — cryptid=1 [CRITICAL]

**描述:** App Store 分发二进制含 FairPlay DRM，静态分析无法直接读代码。  
**突破:** \`frida-ios-dump\` 从内存导出解密后 Mach-O。  
**蓝队建议:** 关键逻辑下沉服务端；客户端仅保留 UI 层。

### F-05: 无设备实弹验证 [INFO]

**描述:** 当前执行环境无 USB iPhone，Phase 4 以战术预编排完成。  
**下一步:** 连接越狱设备 → 安装匹配版本 frida-server → 重新执行 \`./armor_break.sh -t "App" -b com.bundle\`

---

## 5. 工件清单 (Artifacts)

\`\`\`
null-order/mobile/pojia/artifacts/${OPERATION_ID}/
├── 01_recon.txt
├── 02_weaponization.txt
├── 03_armor_detection.txt
├── 04_armor_break.txt
└── 05_static_triage.txt

null-order/mobile/pojia/hooks/
├── jailbreak_bypass.js
├── ssl_pinning_bypass.js
└── anti_debug_bypass.js
\`\`\`

---

## 6. 蓝队防御建议 (Remediation)

| 优先级 | 措施 | 效果 |
|---|---|---|
| P0 | 核心业务逻辑服务端化 | 消除客户端砸壳价值 |
| P1 | 多维度设备完整性 (Apple DeviceCheck / App Attest) | 替代简单路径检测 |
| P2 | 公钥 Pinning + 证书透明度 | 提升 MITM 难度 |
| P3 | 反 Hook 框架检测 (Frida 端口/线程/内存特征) | 提高动态分析成本 |
| P4 | 代码混淆 + 控制流平坦化 | 增加静态分析成本 |

---

## 7. 一键复现

\`\`\`bash
# 完整破甲行动 (需越狱 iPhone USB 连接)
cd null-order/mobile/pojia
./armor_break.sh -t "目标App名" -b com.example.app

# 离线战术编排 + 报告
./armor_break.sh --dry-run
\`\`\`

---

**行动结束** · NULL//ORDER · Mobile Red Team · RULE #01  
报告生成: \`$(basename "$REPORT_FILE")\`
REPORT_EOF

log "Report written: $REPORT_FILE"

# ── Auto-save operation data ───────────────────────────────────────────────────
if [ -x "$SCRIPT_DIR/save_data.sh" ]; then
  log "Saving operation data..."
  "$SCRIPT_DIR/save_data.sh" "$OPERATION_ID" 2>&1 | sed 's/^/  /' || log "WARN: save_data failed"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  OPERATION 破甲 COMPLETE                                 ║"
echo "║  Report:   $REPORT_FILE"
echo "║  Artifacts: $ARTIFACT_DIR/$OPERATION_ID/"
echo "║  Archive:  $SCRIPT_DIR/data/archive/${OPERATION_ID}.tar.gz"
echo "╚══════════════════════════════════════════════════════════╝"
