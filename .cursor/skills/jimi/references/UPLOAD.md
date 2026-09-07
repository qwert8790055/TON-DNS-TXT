# 服务器上传指南

文件**只能上传到您的服务器**，请按以下步骤操作。

## 服务器上传路径

```
/var/www/skills-upload/
├── jimi/      ← 机密技能相关文件
├── pdfs/      ← 渗透测试手册、红队指南等 PDF
├── scripts/   ← 基线检查脚本
└── README.txt
```

## 从 Mac 上传（终端）

```bash
# 1. 进入您电脑上文件所在目录
cd ~/Downloads/机密

# 2. 上传 PDF 到服务器
scp *.pdf root@135.181.228.18:/var/www/skills-upload/pdfs/

# 3. 上传 xlsx 等文档
scp *.xlsx root@135.181.228.18:/var/www/skills-upload/jimi/

# 4. 上传脚本（zip 解压后）
scp -r Linux基线检查脚本_1.5/* root@135.181.228.18:/var/www/skills-upload/scripts/
```

输入服务器 root 密码后即可上传。

## 上传完成后

在 Cursor 对话中回复：**「服务器已上传」**

Agent 会：
1. 从 `/var/www/skills-upload/` 拉取文件
2. 同步到 `.cursor/skills/jimi/references/`
3. 更新 `SKILL.md` 索引

## 禁止上传

- `十几万个漏洞POC.zip`
- `Cobalt Strike Arsenal_kit.zip`
- 任何未授权攻击工具

## 应用部署路径（已有，无需重复上传）

| 内容 | 服务器路径 |
|------|-----------|
| 前端网页 | `/var/www/dns-text/client/` |
| 后端 API | `/var/www/dns-text/server/` |
| 技能参考文件 | `/var/www/skills-upload/` |
