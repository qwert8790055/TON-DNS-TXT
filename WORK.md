# WORK.md — 工作核心文档

> **这是整个项目最重要的文件。** 所有工作从这里开始。

---

## 一、项目是什么

**TON DNS Text Manager** — 管理 `.ton` 域名的 `dns_text` 链上记录。

| 环境 | 地址 |
|------|------|
| 生产环境 | http://135.181.228.18:8080 |
| 源码仓库 | TON-DNS-TXT (GitHub) |
| 服务器 | `ssh root@135.181.228.18` |

---

## 二、每日工作入口

```
开始工作
    │
    ├─ 开发功能？     → 第三节
    ├─ 安全检查？     → 第四节 + bash scripts/security-check.sh
    ├─ 部署更新？     → 第五节 + COMMANDS.md
    └─ 上传技能文件？  → 第六节
```

---

## 三、开发工作

```bash
# 启动开发环境
cd server && npm run dev          # API :4727
cd client && npm run dev          # Web :5173

# 构建
cd server && npm run build
cd client && npm run build

# 提交
git checkout -b cursor/功能名-0699
git add . && git commit -m "描述" && git push
```

---

## 四、安全工作（最重要）

### 开始前的必读

1. `.cursor/skills/jimi/references/secure-operations.md` — 安全规范
2. `.cursor/rules/00-security.mdc` — Agent 强制规则

### 安全检查（每次部署后必跑）

```bash
bash scripts/security-check.sh
```

必须 6/6 通过：

| 检查项 | 说明 |
|--------|------|
| 前端可达 | HTTP 200 |
| API 可达 | HTTP 200 |
| CORS 阻止 evil | 无 `Allow-Origin: *` |
| 输入校验 | 无效地址返回 400 |
| 安全头 | nosniff, SAMEORIGIN |
| TonConnect | manifest 指向正确地址 |

### 授权边界

| ✅ 可以 | ❌ 禁止 |
|---------|---------|
| 自有服务器 `135.181.228.18` | 第三方网站扫描 |
| 本仓库代码审计 | 未授权 exploit |
| 完善技能包 | 武器化工具部署 |

### 当前安全状态

**评级：🟢 Low**（2026-09-07 加固完成）

---

## 五、部署工作

```bash
# 构建
cd client && npm run build
cd server && npm run build

# 上传（从开发机或 Agent）
scp -r client/dist/* root@135.181.228.18:/var/www/dns-text/client/
# 服务器端 API 更新见 COMMANDS.md 第五节

# 验证
bash scripts/security-check.sh
```

---

## 六、技能包工作

```
.cursor/skills/jimi/
├── SKILL.md                         # 技能入口
├── references/
│   ├── secure-operations.md         # ⭐ 安全规范
│   ├── methodology.md               # 渗透方法论
│   └── uploaded/                    # 已同步文件
```

Mac 上传 PDF（可选）：
```bash
scp 文件.pdf root@135.181.228.18:/var/www/skills-upload/pdfs/
```
然后对 Agent 说「服务器已上传」。

---

## 七、文档地图

| 文档 | 何时读 |
|------|--------|
| **`WORK.md`**（本文件） | 每天开始工作 |
| `secure-operations.md` | 做任何安全相关操作 |
| `COMMANDS.md` | 需要具体命令时 |
| `SECURITY.md` | 了解安全策略 |
| `AGENTS.md` | Cloud Agent 配置 |
| `PENTEST-*.md` | 查看审计报告 |

---

## 八、服务管理

```bash
ssh root@135.181.228.18

pm2 status dns-text-api      # 查看 API
pm2 restart dns-text-api    # 重启 API
pm2 logs dns-text-api        # 查看日志
systemctl reload nginx       # 重载 Nginx
```

---

## 九、完成清单

- [x] 应用部署 `135.181.228.18:8080`
- [x] 安全加固（CORS/限流/校验/安全头）
- [x] 漏洞评估 + 深度复测（Low）
- [x] 技能包 `jimi`（2 个参考文件）
- [x] 安全工作规范
- [x] Cursor 安全规则 `.cursor/rules/`
- [x] 安全健康检查脚本
- [ ] HTTPS 域名（可选，提供域名即可）

---

*安全工作不是选项，是前提。每次操作前问自己：这在授权范围内吗？*
