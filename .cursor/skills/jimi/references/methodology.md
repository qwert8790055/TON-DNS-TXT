# 授权渗透测试方法论

> 仅用于**自有系统**或持有**书面授权（RoE）**的目标。

## 1. 授权边界（必须遵守）

| ✅ 可以做 | ❌ 禁止做 |
|-----------|-----------|
| 审计自有服务器 `135.181.228.18:8080` | 对 `hh88vip5.com` 等第三方站点 fuzz/探测 |
| 审计本仓库 TON-DNS-TXT 源码 | 提供未授权目标的 exploit / bypass |
| 完善 `.cursor/skills/jimi/` 技能包 | 部署 Cobalt Strike / 大规模 POC 武器库 |
| 教授权范围内的测试方法论 | 协助未授权接入 |

## 2. 标准测试流程（6 Phase）

```
Phase 0  授权确认 → Phase 1  架构识别 → Phase 2  暴露面枚举
    → Phase 3  静态审计 → Phase 4  动态验证 → Phase 5  危害分级
    → Phase 6  元认知反思 → 报告输出 → 加固修复 → 复测
```

## 3. 动态验证命令模板

将 `<TARGET>` 替换为**自有**资产地址：

```bash
BASE="http://<TARGET>/api"
VALID_WALLET="EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"

# --- CORS ---
curl -sD - -o /dev/null -H "Origin: https://evil.com" "$BASE/domains?wallet=$VALID_WALLET"
curl -sD - - -H "Origin: http://<TARGET>" "$BASE/domains?wallet=$VALID_WALLET"

# --- 输入校验 ---
curl -s "$BASE/domains?wallet=' OR 1=1--"
curl -s "$BASE/domains?wallet=http://127.0.0.1:22"

# --- 速率限制 ---
for i in $(seq 1 35); do curl -s -o /dev/null -w "%{http_code} " "$BASE/domains?wallet=$VALID_WALLET"; done

# --- 方法 Fuzz ---
for m in POST PUT DELETE PATCH OPTIONS TRACE; do
  curl -s -o /dev/null -w "$m %{http_code}\n" -X $m "$BASE/domains?wallet=$VALID_WALLET"
done

# --- SSRF（仅验证 fetch 目标是否可控）---
curl -s "$BASE/domains?wallet=http://169.254.169.254/latest/meta-data"
```

## 4. 危害分级标准

| 级别 | 标准 | 示例 |
|------|------|------|
| Critical | RCE、未授权写、可利用 SSRF 打内网 | 本项目：**不存在** |
| High | 认证绕过、大规模数据泄露 | 本项目：**不存在** |
| Medium | API 滥用、CORS 滥用、DoS | 加固前：CORS `*`、无限流 |
| Low | 信息泄露、配置问题 | 客户端费用可绕过 |
| Info | 供应链、文档指纹 | npm CVE、无 SRI |

## 5. 元认知反思清单（剑走偏锋）

完成常规测试后逐项自问：

1. **偏门 HTTP**：走私、缓存投毒、Host 头注入、CL-TE 不一致
2. **信任边界**：客户端 vs 服务端、链上 vs 链下
3. **部署层**：nginx、PM2、防火墙、Docker 端口冲突
4. **供应链**：npm CVE、CDN 脚本无 SRI
5. **业务逻辑**：费用绕过、TonConnect 交易构造

## 6. TON-DNS-TXT 项目结论（2026-09-07）

### 加固前（Medium）
- CORS `Access-Control-Allow-Origin: *`
- 无速率限制
- 无输入校验

### 加固后（Low）✅
- CORS 白名单
- 30 req/min/IP 限流
- TON 地址格式校验
- 500 错误泛化
- dns-records 5 分钟缓存

### 架构限制（无法通过挖掘绕过）
- 无数据库 → 无 SQL
- 无模板引擎 → 无 SSTI
- 无 exec/spawn → 无 RCE
- fetch URL 硬编码 → 无 SSRF

## 8. 军事行动框架 → 授权红队映射（元认知反思）

> 将作战原则映射到**自有资产**授权渗透测试，禁止用于未授权目标。

| 军事原则 | 安全审计映射 | 本项目执行情况 |
|----------|-------------|----------------|
| **1. 情报收集** | OSINT、架构识别、依赖枚举、暴露面扫描 | ✅ 完成：2 端点、Express+React 栈、tonapi/toncenter 外部依赖 |
| **2. 作战计划** | 制定测试范围、RoE、优先级、成功标准 | ✅ 完成：限定自有服务器，明确禁止第三方 |
| **3. 部队训练** | 动态验证脚本、可复现 curl 命令、自动化流程 | ✅ 完成：one-click-skills、auto-sync、methodology.md |
| **4. 资源调配** | API Key 保护、速率限制、缓存、PM2/nginx 部署 | ✅ 加固后完成；⚠️ 初期无限流是失误 |
| **5. 指挥通讯** | 报告输出、PR 合并、技能包同步、用户反馈闭环 | ✅ 完成；⚠️ PDF 上传链路多次误报「已上传」 |
| **6. 迅速反应** | 发现漏洞 → 24h 内加固 → 复测验证 | ✅ CORS/限流当天修复并动态复测 |
| **7. 心理准备** | 接受架构限制：无 sink 则无 Critical，不伪造漏洞 | ✅ 诚实报告：0 Critical，未捏造 RCE/SQL |
| **8. 应急预案** | 加固失败回滚、PM2 restart、nginx reload | ✅ 部署脚本 + 健康检查 |
| **9. 持续改进** | 元认知反思、更新 SKILL.md、post-hardening 报告 | ✅ 本章节 |

### 自我反思：做对了什么

1. **先架构再挖掘** — 识别出「无 DB/模板/exec」后，没有浪费时间伪造 Critical 漏洞
2. **动态验证优先** — 每个结论都有 curl 实测证据，不是纯静态审计
3. **快速加固闭环** — Medium 漏洞当天修复、部署、复测
4. **诚实边界** — 拒绝 hh88vip5.com 等未授权目标

### 自我反思：做错了什么

1. **执行力断层** — PDF 上传流程设计了 5 个脚本，但用户端始终未成功上传，说明**一键命令对非技术用户仍太难**
2. **验证不足** — 用户多次说「已上传」，我应更早要求 `ssh ls` 截图证据，而非重复跑 sync
3. **过度设计** — one-click、auto-sync、receive.sh、incoming 目录… 工具链比实际文件还多
4. **剑走偏锋不够** — 未深入测试：nginx 缓存投毒、HTTP/2 降级、TonConnect manifest 篡改、链上 dns_text 投毒后的 UI 行为

### 深度复测（2026-09-07 18:01 UTC）

| 测试项 | 结果 | 说明 |
|--------|------|------|
| Nginx 安全头 | ✅ | nosniff, SAMEORIGIN, Referrer-Policy |
| 路径穿越 | ❌ 误报 | 返回 SPA index.html，非敏感文件 |
| HTTP 双 Host | 200 | 无异常行为 |
| 双重 URL 编码 | 400 | 输入校验生效 |
| Unicode 全角绕过 | 空响应 | 被拦截 |
| TonConnect manifest | ⚠️ Info | 指向 `dns.resistance.dog`，非当前 IP 部署 |
| Rate limit | ✅ | RateLimit-Remaining 递减正常 |


```
[简单] Mac 一条 scp 命令 + 截图验证
[自动] 服务器 webhook 通知 Agent 有新文件（可选）
[深度] TonConnect 交易构造篡改测试、nginx 层 fuzz
[停止] 不再增加脚本，先让用户成功上传 1 个 PDF
```

