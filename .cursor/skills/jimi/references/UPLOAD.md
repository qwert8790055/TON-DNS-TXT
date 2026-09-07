# 一键上传指南

## Mac 一键命令（复制粘贴即可）

```bash
# 方式 1：已有仓库
cd ~/TON-DNS-TXT && bash scripts/one-click-skills.sh ~/Downloads/机密

# 方式 2：任意目录，指定机密文件夹路径
bash /path/to/TON-DNS-TXT/scripts/one-click-skills.sh ~/Downloads/机密
```

脚本会自动：
1. 上传 PDF / xlsx / 脚本到服务器
2. 服务器自动建立文件索引 `INDEX.json`
3. 显示验证结果

完成后回到 Cursor 说：**服务器已上传** → Agent 自动同步到技能包。

---

## 全自动流程

```
Mac 一键上传                    服务器自动处理              Cursor Agent 自动同步
─────────────────              ─────────────────           ─────────────────────
one-click-skills.sh  ──scp──►  /var/www/skills-upload/  auto-sync-skills.sh
                               process.sh → INDEX.json    → references/uploaded/
                                                          → 更新 SKILL.md
```

---

## 服务器路径

```
/var/www/skills-upload/
├── pdfs/       ← PDF 文件
├── jimi/       ← xlsx、文档
├── scripts/    ← 基线检查脚本
├── process.sh  ← 自动索引（已部署）
└── INDEX.json  ← 文件清单（自动生成）
```

## 禁止上传

- Cobalt Strike 套件
- 大规模 POC 武器库 zip
