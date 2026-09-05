#!/usr/bin/env bash
# 防骗测试报告 · 一键生成（无需 Apple ID / 无需真机 / 无需越狱）
# 适用于：被骗后收集证据、撰写警示报告、防止更多人上当
#
# Usage:
#   ./scam_report.sh                    # 交互式填写
#   ./scam_report.sh --from case.env    # 从配置文件生成
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
REPORT_DIR="$REPO_ROOT/null-order/reports"
DATA_DIR="$SCRIPT_DIR/data"
CASE_FILE="${1:-$SCRIPT_DIR/case.env}"

REPORT_ID="SCAM-$(date +%Y%m%d-%H%M%S)"

# ── Interactive or load case.env ───────────────────────────────────────────────
if [ "${1:-}" = "--from" ] && [ -n "${2:-}" ]; then
  CASE_FILE="$2"
fi

if [ -f "$CASE_FILE" ] && [ "${1:-}" != "--interactive" ]; then
  # shellcheck disable=SC1090
  source "$CASE_FILE"
else
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  防骗测试报告 · 信息收集（无需设备）                     ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  read -rp "诈骗 App 名称: " SCAM_APP_NAME
  read -rp "下载渠道 (链接/爱思/网页): " SCAM_DOWNLOAD
  read -rp "对方话术/卡款理由: " SCAM_SCRIPT
  read -rp "损失金额 (可选): " SCAM_AMOUNT
  read -rp "收款方式 (银行卡/USDT/支付宝等): " SCAM_PAYMENT
  read -rp "对方联系方式 (微信/TG/电话，可模糊): " SCAM_CONTACT
  read -rp "你的经历摘要 (一段话): " SCAM_STORY
fi

SCAM_APP_NAME="${SCAM_APP_NAME:-未提供}"
SCAM_DOWNLOAD="${SCAM_DOWNLOAD:-未提供}"
SCAM_SCRIPT="${SCAM_SCRIPT:-未提供}"
SCAM_AMOUNT="${SCAM_AMOUNT:-未提供}"
SCAM_PAYMENT="${SCAM_PAYMENT:-未提供}"
SCAM_CONTACT="${SCAM_CONTACT:-未提供}"
SCAM_STORY="${SCAM_STORY:-未提供}"
SCAM_TYPE="${SCAM_TYPE:-通用}"
ICLOUD_LOCK="${ICLOUD_LOCK:-未说明}"
DEVICE_SOURCE="${DEVICE_SOURCE:-未说明}"
APPLE_ID_OWNER="${APPLE_ID_OWNER:-未说明}"

# ID锁套路专项段落
ID_LOCK_SECTION=""
if [ "$SCAM_TYPE" = "ID锁套路" ] || echo "$SCAM_DOWNLOAD$SCAM_SCRIPT$SCAM_STORY" | grep -qiE 'ID锁|id锁|激活锁|iCloud|爱思|企业签'; then
  ID_LOCK_SECTION="
---

## 3.5 ID锁 / 爱思助手套路解析（重点）

这是 iOS 诈骗中极常见的组合套路：

### 套路链条

\`\`\`
低价二手有锁机 / 借用他人 Apple ID
        ↓
爱思助手 / 企业签 安装涉诈 App（绕过 App Store）
        ↓
前期小额提现成功 → 建立信任（杀猪盘养熟）
        ↓
大额提现被拒 → 流水不足 / 保证金 / 税费
        ↓
若尝试刷机/越狱失败 → ID锁激活 → 手机变砖
        ↓
卖家/平台消失，钱和手机两空
\`\`\`

### 你的情况记录

| 项目 | 内容 |
|---|---|
| 是否遇 ID锁 | ${ICLOUD_LOCK} |
| 设备来源 | ${DEVICE_SOURCE} |
| Apple ID 归属 | ${APPLE_ID_OWNER} |

### 关键事实

1. **ID锁只能由原 Apple ID 主人解除**，没有合法「黑客解锁」
2. **爱思助手安装的 App 很多未上架**，含博彩/杀猪盘高发
3. **别人的 Apple ID** = 对方随时可远程锁机
4. 任何收「解锁费」「保证金」的都是**二次诈骗**

### 你能做的（合法）

- 保留购买记录、聊天记录、转账凭证 → **报警**
- 向 Apple 举报涉诈 App
- **不要**再向任何人付解锁费/解冻费
"
fi

mkdir -p "$REPORT_DIR" "$DATA_DIR/scam_cases"

# Pattern matching for scam script analysis
MATCH_FLOW="—"
MATCH_FEE="—"
MATCH_AUDIT="—"
echo "$SCAM_SCRIPT" | grep -qiE '流水|打码|投注' && MATCH_FLOW="⚠️ 疑似"
echo "$SCAM_SCRIPT" | grep -qiE '保证金|解冻|税费|手续费|验证金' && MATCH_FEE="🔴 高危"
echo "$SCAM_SCRIPT" | grep -qiE '审核|风控|异常|验证' && MATCH_AUDIT="⚠️ 疑似"

# Save case data
CASE_JSON="$DATA_DIR/scam_cases/${REPORT_ID}.json"
python3 - <<PYEOF
import json, datetime
case = {
    "report_id": "$REPORT_ID",
    "created_at": datetime.datetime.now().isoformat(),
    "app_name": "$SCAM_APP_NAME",
    "download_channel": "$SCAM_DOWNLOAD",
    "scam_script": "$SCAM_SCRIPT",
    "amount_lost": "$SCAM_AMOUNT",
    "payment_method": "$SCAM_PAYMENT",
    "contact": "$SCAM_CONTACT",
    "victim_story": "$SCAM_STORY",
    "disclaimer": "防御性研究 · 未对第三方设备做未授权访问",
}
with open("$CASE_JSON", "w") as f:
    json.dump(case, f, indent=2, ensure_ascii=False)
PYEOF

REPORT_FILE="$REPORT_DIR/NØ-防骗报告-${REPORT_ID}.md"

cat > "$REPORT_FILE" <<REPORT_EOF
# NØ//防骗测试报告 · ${REPORT_ID}

**类型:** 诈骗 App 防御性分析 / 公众警示  
**时间:** $(date -Is)  
**性质:** 受害者协助研究 · **非攻击性** · 无需 Apple ID / 无需他人设备

---

## 1. 摘要

${SCAM_STORY}

本报告目的：**记录诈骗手法、提醒公众、协助举报**，不涉及对他人手机或 Apple ID 的未授权访问。

---

## 2. 涉案 App 信息

| 字段 | 内容 |
|---|---|
| App 名称 | ${SCAM_APP_NAME} |
| 下载/分发渠道 | ${SCAM_DOWNLOAD} |
| 对方联系方式 | ${SCAM_CONTACT} |
| 涉案金额 | ${SCAM_AMOUNT} |
| 收款方式 | ${SCAM_PAYMENT} |

---

## 3. 诈骗话术分析（卡款/二次收割）

**对方使用的理由/话术：**

> ${SCAM_SCRIPT}

### 常见匹配模式（威胁情报库）

| 模式 | 是否匹配 | 说明 |
|---|---|---|
| 流水不足 / 打码量不够 | ${MATCH_FLOW} | 典型 BC 假博彩卡款 |
| 保证金 / 解冻金 / 税费 | ${MATCH_FEE} | 二次收割 |
| 风控审核 / 账户异常 | ${MATCH_AUDIT} | 拖延出款 |
| 信任充值（前期小额可提） | 需人工确认 | 杀猪盘养熟阶段 |

${ID_LOCK_SECTION}

---

## 4. 技术侧说明（无需破甲他人设备）

> **重要：** 你使用的是**别人的 Apple ID / 设备**时，**不应**尝试越狱、砸壳或登录他人账号做技术分析——这既违法，也无法作为有效证据。

### 受害者可安全收集的证据

- [ ] App 名称、图标截图
- [ ] 下载页面 / 企业签名分发页 URL
- [ ] 充值/提现界面截图
- [ ] 与客服/导师的聊天记录（完整导出）
- [ ] 转账记录、银行流水、USDT 哈希
- [ ] 对方收款账号、钱包地址
- [ ] 群聊/频道链接（Telegram/微信）

### 不建议做的事

- ❌ 登录他人 Apple ID
- ❌ 对非本人设备越狱 / 安装 frida
- ❌ 向 scammer 继续转账「解冻」
- ❌ 删除聊天记录和转账凭证

---

## 5. 举报渠道

| 渠道 | 操作 |
|---|---|
| **110 / 反诈专线 96110** | 报案，提供转账记录和聊天证据 |
| **国家反诈中心 App** | 举报涉诈 App / 网址 |
| **Apple** | [reportaproblem.apple.com](https://reportaproblem.apple.com) 举报恶意 App |
| **微信支付/支付宝** | 账单详情 → 投诉 |
| **区块链** | USDT 哈希在链上可追溯，提交给警方 |

---

## 6. 公众警示（可直接转发）

---
⚠️ 警惕「${SCAM_APP_NAME}」类诈骗 App

特征：
- 通过爱思助手/企业签安装，非 App Store 正规渠道
- 使用他人 Apple ID 或二手有锁机，存在 ID锁 风险
- 前期小额提现成功，建立信任
- 大额提现时以「流水不足」「保证金」「ID解锁费」等理由拒付或继续要钱

请勿继续转账。已受骗请保留证据报警（96110）。
---

---

## 7. 后续建议

1. **立即停止**向该平台/对方转账
2. **保全证据**：截图、聊天、流水导出备份
3. **报警**并说明是电信诈骗/网络诈骗
4. **勿信**「追款律师」「黑客解冻」等二次诈骗
5. 本报告可提交警方或反诈中心作为辅助材料

---

**报告 ID:** \`${REPORT_ID}\`  
**数据存档:** \`null-order/mobile/pojia/data/scam_cases/${REPORT_ID}.json\`

— NULL//ORDER · 防御性研究 · 防止更多人上当
REPORT_EOF

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  防骗报告已生成                                          ║"
echo "║  $REPORT_FILE"
echo "║  数据: $CASE_JSON"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "你无需 Apple ID 或他人设备。请把证据截图和本报告一并提交警方/96110。"
