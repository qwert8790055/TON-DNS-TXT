# 命令清单（最终版）

> 项目已完成部署、加固、漏洞评估。以下所有命令可直接复制执行。

---

## 一、访问应用

```
浏览器打开: http://135.181.228.18:8080
```

---

## 二、服务器管理命令（SSH 登录后执行）

```bash
# 登录服务器
ssh root@135.181.228.18

# 查看 API 状态
pm2 status dns-text-api
pm2 logs dns-text-api --lines 20

# 重启 API
pm2 restart dns-text-api

# 重启 Nginx
systemctl reload nginx

# 查看上传目录
ls -lh /var/www/skills-upload/pdfs/
ls -lh /var/www/skills-upload/jimi/
```

---

## 三、Mac 上传 PDF（以后需要时）

```bash
# 单文件上传
scp ~/Downloads/你的文件.pdf root@135.181.228.18:/var/www/skills-upload/pdfs/

# 验证
ssh root@135.181.228.18 "ls -lh /var/www/skills-upload/pdfs/"
```

---

## 四、安全验证命令

```bash
# 健康检查
curl -s -o /dev/null -w "前端:%{http_code}\n" http://135.181.228.18:8080/
curl -s -o /dev/null -w "API:%{http_code}\n" "http://135.181.228.18:8080/api/domains?wallet=EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"

# CORS 检测（evil 应无 Allow-Origin）
curl -sD - -o /dev/null -H "Origin: https://evil.com" "http://135.181.228.18:8080/api/domains?wallet=EQtest" | grep -i access-control

# 速率限制（30次后应 429）
for i in $(seq 1 35); do curl -s -o /dev/null -w "%{http_code} " "http://135.181.228.18:8080/api/domains?wallet=EQtest$i"; done
```

---

## 五、重新部署（代码更新后）

```bash
# 在 Cloud Agent 或本地仓库执行
cd server && npm run build
cd ../client && npm run build

# 上传到服务器
scp -r client/dist/* root@135.181.228.18:/var/www/dns-text/client/
scp -r server/dist server/package.json root@135.181.228.18:/var/www/dns-text/server/

# 服务器上
ssh root@135.181.228.18 "cd /var/www/dns-text/server && npm install --omit=dev && pm2 restart dns-text-api"
```

---

## 六、项目完成状态

| 项目 | 状态 |
|------|------|
| 应用部署 `135.181.228.18:8080` | ✅ 完成 |
| 安全加固（CORS/限流/校验） | ✅ 完成 |
| 漏洞评估 + 深度复测 | ✅ 完成（风险 Low） |
| 渗透报告 | ✅ `null-order/reports/PENTEST-*.md` |
| 技能包 `jimi` | ✅ 完成（含方法论） |
| PDF 参考文档 | ⏭️ 跳过（可选，以后上传） |
| HTTPS 域名 | ⏭️ 可选（提供域名即可配置） |

---

## 七、关键路径

| 内容 | 路径 |
|------|------|
| 前端 | `/var/www/dns-text/client/` |
| 后端 API | `/var/www/dns-text/server/` (PM2: dns-text-api, 端口 4727) |
| Nginx | `/etc/nginx/sites-available/dns-text` (端口 8080) |
| 技能上传 | `/var/www/skills-upload/` |
| 技能包 | `.cursor/skills/jimi/` |
| 命令清单 | `COMMANDS.md`（本文件） |
