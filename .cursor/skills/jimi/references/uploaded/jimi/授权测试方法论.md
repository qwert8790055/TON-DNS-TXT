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

## 7. 报告输出

完整报告见：
- `null-order/reports/PENTEST-TON-DNS-TXT-20260907.md`
- `null-order/reports/PENTEST-TON-DNS-TXT-20260907-HARDENING.md`
