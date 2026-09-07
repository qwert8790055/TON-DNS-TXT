---
name: jimi
description: 授权安全审计技能包。对 TON-DNS-TXT 及同类 Web 应用进行架构剖析、暴露面枚举、动态漏洞验证与危害评估。仅在用户拥有合法授权的目标上使用。
environments: [cloud, local]
---

# 安全审计技能包（授权测试）

> 仅用于**自有系统**或**书面授权**的渗透测试。禁止对未授权目标使用。

## 何时使用

- 用户要求漏洞挖掘、安全审计、动态验证
- 需要分析 Express/React/Telegram Bot 架构
- 需要复现并验证已发现的安全问题

## 工作流程（必须按序执行）

### Phase 0 — 授权与范围确认
1. 确认目标属于用户自有资产（本仓库、其部署服务器）
2. 明确禁止：第三方系统、未授权扫描、武器化工具部署

### Phase 1 — 架构与语言识别
```
识别栈 → 绘制数据流 → 枚举入口点 → 标记信任边界
```
| 层级 | 本项目 |
|------|--------|
| 前端 | React 18 + Vite + TypeScript + TonConnect |
| 后端 | Express 4 + Node 22，仅 2 个 GET 路由 |
| 存储 | 无数据库；链上数据 + localStorage |
| 外部 | tonapi.io, toncenter.com, telegram.org |

### Phase 2 — 暴露面枚举
**HTTP 端点：**
- `GET /api/domains?wallet=` → TONAPI 代理
- `GET /api/dns-records?address=` → TonCenter JSON-RPC 代理

**非 HTTP：** TonConnect 钱包签名写链、Telegram Bot 命令

**配置文件：** `server/.env`, `client/.env`, nginx, PM2

### Phase 3 — 静态分析清单
- [ ] 用户输入 → sink 追踪（req.query → fetch URL/body）
- [ ] SSRF：fetch 目标是否硬编码？参数能否改变 host？
- [ ] SQL/SSTI/RCE：是否存在 DB/模板/命令执行？
- [ ] 认证：端点是否需鉴权？
- [ ] CORS、速率限制、错误信息泄露
- [ ] 依赖 CVE（express, @ton/core, axios 等）

### Phase 4 — 动态验证（必须执行，禁止只报静态结论）

对**每个**候选漏洞运行实测：

```bash
BASE="http://<TARGET>:8080/api"

# CORS
curl -sD - -o /dev/null -H "Origin: https://evil.com" "$BASE/domains?wallet=test"

# SSRF 探测
curl -s "$BASE/domains?wallet=http://169.254.169.254/"
curl -s "$BASE/dns-records?address=http://127.0.0.1:22"

# 方法 Fuzz
for m in POST PUT DELETE PATCH OPTIONS TRACE; do
  curl -s -o /dev/null -w "$m %{http_code}\n" -X $m "$BASE/domains?wallet=test"
done

# 速率限制
for i in $(seq 1 30); do curl -s -o /dev/null -w "%{http_code} " "$BASE/domains?wallet=test$i"; done

# 注入探测
curl -s "$BASE/domains?wallet=' OR 1=1--"
curl -s "$BASE/domains?wallet=../../../etc/passwd"
```

记录：**请求、响应状态码、响应体、危害结论**。

### Phase 5 — 危害分级
| 级别 | 标准 |
|------|------|
| Critical | RCE、未授权写、全库泄露、可利用 SSRF 打内网 |
| High | 认证绕过、敏感数据大规模泄露 |
| Medium | API 滥用、配额耗尽、CORS 滥用、DoS |
| Low | 信息泄露、配置问题 |

### Phase 6 — 元认知反思（剑走偏锋）
完成常规测试后，自问：
1. **我是否因为框架熟悉而漏掉了偏门？**（HTTP 走私、缓存投毒、JSON 内容类型混淆）
2. **信任边界在哪？**（客户端费用可绕过、链上数据公开可读）
3. **供应链？**（telegram-web-app.js 无 SRI、npm 依赖）
4. **部署层？**（nginx 配置、PM2、防火墙、Docker Caddy 抢 80/443）
5. **信息是否匮乏？** → WebSearch 查 Express/TON API 已知问题

## 本项目已验证结论（2026-09-07）

| 漏洞类型 | 结果 | 危害 |
|----------|------|------|
| RCE | **不存在** | 无 exec/spawn/模板渲染 |
| SQL 注入 | **不存在** | 无数据库 |
| SSTI | **不存在** | 无服务端模板 |
| SSRF（回显） | **不可利用** | fetch 目标硬编码 tonapi.io / toncenter.com |
| CORS `*` | **已验证** | Medium：任意站点可跨域调用 API |
| 无限流 | **已验证** | Medium：可耗尽 TONAPI/TonCenter 配额 |
| 输入无校验 | **已验证** | Low：任意字符串转发上游 |
| 客户端费用绕过 | **设计限制** | Low：VITE_* 编译进前端，可改 JS 免手续费 |

**结论：** 此应用架构极简，**不可能**挖出 3 个 Critical 级 RCE/SSRF/SQL 漏洞——因为根本没有对应 sink。应聚焦 API 滥用加固与部署层安全。

## 参考文档

将方法论 PDF 放入 `references/`（仅限教育用途）：
- 渗透测试手册、红队指南、应急响应手册 ✅
- Cobalt Strike 套件、大规模 POC 武器库 ❌ 禁止打包

## 加固建议（按优先级）

1. `express-rate-limit` 按 IP 限流
2. CORS 限制为 `dns.resistance.dog` 及 Telegram WebApp 域
3. TON 地址格式校验（`EQ`/`UQ` + base64url 长度）
4. 响应缓存（dns-records 链上数据变化慢）
5. 泛化 500 错误信息
