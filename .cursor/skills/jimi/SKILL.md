---
name: jimi
description: 授权安全审计技能包。对自有 TON-DNS-TXT 应用进行架构剖析、暴露面枚举、动态漏洞验证、加固与复测。禁止对未授权第三方目标使用。
environments: [cloud, local]
---

# 安全审计技能包（授权测试）

> 仅用于**自有系统**或**书面授权**的渗透测试。禁止对未授权目标使用。

## 授权边界

| ✅ 可以 | ❌ 不可以 |
|---------|-----------|
| 审计 `135.181.228.18:8080` | 对 hh88vip5.com 等第三方 fuzz/探测 |
| 审计本仓库源码 | 提供未授权 exploit/bypass |
| 完善本技能包 | 部署武器化工具包 |
| 教授权测试方法论 | 协助未授权接入 |

## 何时使用

- 用户要求漏洞挖掘、安全审计、动态验证、安全强化
- 需要分析 Express/React/Telegram Bot 架构
- 需要复现并验证已发现的安全问题

## 工作流程

详见 `references/methodology.md`，核心 6 Phase：

1. **授权确认** — 确认目标为自有资产
2. **架构识别** — 栈、数据流、信任边界
3. **暴露面枚举** — 端点、输入、外部调用
4. **静态审计** — sink 追踪、配置、依赖 CVE
5. **动态验证** — curl 实测，禁止只报静态结论
6. **元认知反思** — 偏门思路、部署层、供应链

## 本项目状态（2026-09-07 最新）

### 架构
- 前端：React 18 + Vite + TonConnect
- 后端：Express 4，2 个 GET 代理端点
- 无 DB / 无模板 / 无命令执行

### 漏洞评估结论

| 类型 | 状态 |
|------|------|
| RCE / SQL / SSTI / SSRF | ❌ 不存在（架构无 sink） |
| CORS 过宽 | ✅ 已修复（白名单） |
| 无限流 | ✅ 已修复（30/min/IP） |
| 输入无校验 | ✅ 已修复（TON 地址格式） |
| 错误泄露 | ✅ 已修复（泛化 500） |
| 客户端费用绕过 | ⚠️ Low（设计限制） |

**风险评级：🟢 Low**

### 动态验证命令

```bash
BASE="http://135.181.228.18:8080/api"
VALID="EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"

# CORS evil → 应无 Allow-Origin
curl -sD - -o /dev/null -H "Origin: https://evil.com" "$BASE/domains?wallet=$VALID"

# CORS allowed → 应有 Allow-Origin
curl -sD - - -H "Origin: http://135.181.228.18:8080" "$BASE/domains?wallet=$VALID"

# Rate limit → 35 次后应出现 429
for i in $(seq 1 35); do curl -s -o /dev/null -w "%{http_code} " "$BASE/domains?wallet=$VALID"; done

# Invalid input → 400
curl -s "$BASE/domains?wallet=' OR 1=1--"
```

## 参考文件

| 文件 | 说明 |
|------|------|
| `references/methodology.md` | 完整授权测试方法论 |
| `references/UPLOAD.md` | **Mac → 服务器上传指南** |
| `references/README.md` | 参考文档分类说明 |

### 一键操作

**Mac 终端（复制这一条）：**
```bash
cd ~/TON-DNS-TXT && bash scripts/one-click-skills.sh ~/Downloads/机密
```

上传后回复「服务器已上传」，Agent 运行 `scripts/auto-sync-skills.sh` 自动同步。

### 服务器上传路径

```
/var/www/skills-upload/
├── jimi/      # 机密文档
├── pdfs/      # 渗透测试 PDF
└── scripts/   # 基线检查脚本
```

上传后回复「服务器已上传」，Agent 从服务器同步到 `references/`。

## 加固清单（已完成 ✅）

- [x] `express-rate-limit` 30 req/min/IP
- [x] CORS `ALLOWED_ORIGINS` 白名单
- [x] TON 地址格式校验 (`server/lib/validation.ts`)
- [x] 500 错误泛化 (`server/lib/errors.ts`)
- [x] dns-records 缓存 5min (`server/lib/cache.ts`)
- [x] JSON body 16KB 限制
- [x] `npm audit fix` 依赖更新（High 已修复，2 个 moderate 为 express 传递依赖）
- [ ] HTTPS + 域名绑定（待用户配置）

## 已上传参考文件（自动同步）

| 文件 | 名称 | 用途 |
|------|------|------|
| `uploaded/jimi/授权测试方法论.md` | 授权测试方法论.md | 机密文档/表格 |

> 同步时间: 2026-09-07T18:01:42Z

