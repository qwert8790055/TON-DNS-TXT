# 参考文件目录

## 可上传（教育/方法论）

| 文件 | 用途 |
|------|------|
| 渗透测试手册-WEB安全漏洞.pdf | Web 漏洞测试方法论 |
| 红队攻击指南.pdf | 红队思路参考 |
| 论信息收集的重要性.pdf | OSINT 与信息收集 |
| JS逆向进入后台.pdf | 前端安全分析 |
| 应急响应实战方案手册.pdf | 应急响应流程 |
| 常见的系统默认口令收集.xlsx | 弱口令检查参考 |
| Linux/Windows 基线检查脚本 | 服务器基线审计 |

## 禁止上传（武器化工具）

以下文件**不能**打包进技能或上传到服务器：

- `十几万个漏洞POC,直接梭哈.zip` — 大规模利用代码库
- `Cobalt Strike 免杀套件 Arsenal_kit.zip` — C2 攻击框架
- 任何未授权使用的商业攻击工具

## 上传方式

### 从 Mac 上传到服务器

```bash
# 1. 在 Mac 终端进入文件所在目录
cd ~/Downloads/机密

# 2. 只上传允许的 PDF/脚本（不要上传 zip 武器库）
scp 渗透测试手册-WEB安全漏洞.pdf 红队攻击指南.pdf root@YOUR_SERVER:/var/www/skills-references/

# 3. 告诉 Agent「已上传到服务器」，会自动同步到本目录
```

### 通过 Cursor 对话上传

把 PDF 文件**拖入聊天框**，或输入 `@` 选择文件。

上传后 Agent 会：
1. 复制到 `references/`
2. 更新 `SKILL.md` 中的文件索引
3. 提交 git
