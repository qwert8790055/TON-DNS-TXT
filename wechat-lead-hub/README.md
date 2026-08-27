<div align="center">

# WeChat Lead Hub · 微信接粉中台

**Open-source telemarketing lead reception platform for WeChat Official Accounts**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)](docker-compose.yml)

Service Account + Subscription Account · Channel QR · H5 Capture · Third-party Transfer

[中文文档](#中文) · [English](#english) · [API Docs](docs/API.md) · [Deploy Guide](docs/DEPLOY.md)

</div>

---

## 中文

### 简介

**微信接粉中台** 是一套开源的电销接粉系统，帮助团队把电话销售获得的客户，通过微信公众号/服务号承接，并自动转接到第三方 CRM 或业务平台。

### 功能特性

- **双号接入** — 服务号 + 订阅号统一管理
- **渠道追踪** — 每个坐席/团队独立带参二维码
- **H5 承接** — 网页授权 + 短信验证 + 手机号采集
- **线索中台** — 去重、状态机、CSV 导出、手动重推
- **转三方** — API 推送 / 带参跳转 / 人工导出
- **管理后台** — 数据看板、渠道转化、推送日志
- **演示模式** — 无需真实微信即可体验完整流程

### 业务流程

```
电销坐席发渠道码 → 客户关注公众号/服务号 → 自动欢迎语 + H5 登记
→ 短信验证手机号 → 线索入库 → 推送/跳转三方 → 客服跟进
```

### 快速开始

```bash
git clone https://github.com/qwert8790055/wechat-lead-hub.git
cd wechat-lead-hub
chmod +x scripts/setup.sh && ./scripts/setup.sh
npm start
```

访问 http://localhost:4780/admin · 账号 `admin` / `admin123`

**Docker 一键启动：**

```bash
docker compose up -d --build
```

### 目录结构

```
wechat-lead-hub/
├── server/              # Express + SQLite 后端
│   └── src/
│       ├── routes/          # 微信 Webhook、H5、管理 API
│       ├── services/        # 线索、渠道、三方推送
│       └── wechat/          # 微信 API 封装
├── web/                 # React 管理后台 + H5 承接页
├── mock-third-party/    # 模拟三方接收器（测试用）
├── docs/                # API 文档、部署指南
├── scripts/             # 安装脚本
├── Dockerfile
└── docker-compose.yml
```

### 微信配置

1. 后台添加服务号/订阅号（AppID、Secret、Token）
2. 微信公众平台 → 服务器 URL：`https://你的域名/api/wechat/{AppID}`
3. 配置网页授权域名、JS 安全域名
4. 为每个坐席创建渠道码

### 三方对接

| 模式 | 说明 |
|------|------|
| API | 实时 POST 线索到三方接口 |
| 跳转 | H5 完成后带参跳转 `{lead_uuid}` `{mobile}` `{channel_code}` |
| 人工 | 后台 CSV 导出 |

详见 [docs/API.md](docs/API.md)

---

## English

### Overview

**WeChat Lead Hub** is an open-source lead reception platform for telemarketing teams. It funnels phone-acquired prospects through WeChat Official Accounts (service + subscription), captures contact info via H5 forms, and forwards leads to third-party CRM/systems.

### Features

- Dual account support (WeChat Service + Subscription accounts)
- Per-agent channel QR codes with attribution
- H5 capture page with SMS verification
- Lead management with dedup, export, retry
- Third-party integration: API push, redirect URLs, manual export
- Admin dashboard with conversion analytics
- Demo mode for testing without real WeChat credentials

### Quick Start

```bash
git clone https://github.com/qwert8790055/wechat-lead-hub.git
cd wechat-lead-hub
npm run setup && npm start
```

Admin UI: http://localhost:4780/admin (admin / admin123)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, TypeScript, SQLite |
| Frontend | React, Vite, TypeScript |
| Auth | JWT + bcrypt |
| WeChat | Official Account API, OAuth, QR codes |

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Telemarketing│────▶│ WeChat Account│────▶│  Lead Hub API   │
│  Agent QR   │     │ (subscribe)   │     │  (this project) │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                     ┌─────────────────────────────┼─────────────────────────────┐
                     ▼                             ▼                             ▼
              ┌────────────┐              ┌────────────┐              ┌────────────┐
              │ H5 Capture │              │ Admin Panel│              │ 3rd Party  │
              │ + SMS      │              │ + Stats    │              │ CRM / API  │
              └────────────┘              └────────────┘              └────────────┘
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome.

## License

[MIT](LICENSE)

## Disclaimer

This software is provided for legitimate business use. Users are responsible for compliance with WeChat platform policies, data privacy regulations, and financial industry rules in their jurisdiction.
