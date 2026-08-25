# 微信接粉中台

电销股票粉承接系统：**服务号 + 订阅号双接入**，支持渠道码追踪、H5 承接、三方推送/跳转、后台统计。

## 功能概览

| 模块 | 功能 |
|------|------|
| 微信接入 | 服务号、订阅号同时接入，统一 Webhook |
| 渠道管理 | 带参二维码，按坐席/团队区分来源 |
| H5 承接 | 网页授权、短信验证、手机号采集 |
| 线索中台 | 状态机、去重、导出、重推 |
| 转三方 | API 推送 / 带参跳转 / 人工导出 |
| 数据看板 | 渠道转化、账号对比、推送日志 |

## 标准业务流程

```
电销坐席发渠道码 → 客户关注公众号/服务号 → 自动欢迎语 + H5 登记
→ 短信验证手机号 → 线索入库 → 推送/跳转三方 → 客服跟进
```

## 快速启动

### 1. 后端

```bash
cd wechat-lead-hub/server
cp .env.example .env
npm install
npm run dev
```

默认端口 `4780`，演示账号已预置。

### 2. 前端

```bash
cd wechat-lead-hub/web
npm install
npm run dev
```

访问 http://localhost:4781

### 3. 登录

- 用户名：`admin`
- 密码：`admin123`

## 演示模式

`DEMO_MODE=true` 时：

- 预置演示服务号 / 订阅号
- 预置 4 个渠道码
- 短信验证码会在接口响应中返回（便于测试）
- 可在「演示测试」页模拟客户关注

## 微信配置

1. 在后台「微信账号」添加服务号/订阅号
2. 微信公众平台 → 开发 → 基本配置：
   - **服务器 URL**：`https://你的域名/api/wechat/{AppID}`
   - **Token**：与后台配置一致
   - **EncodingAESKey**：可选（加密模式）
3. 设置网页授权域名、JS 安全域名为 H5 域名
4. 在「渠道码管理」为每个坐席生成二维码

## 三方对接

### API 模式

POST 到配置的 `api_url`，Body：

```json
{
  "lead_id": "uuid",
  "mobile": "13800138000",
  "openid": "...",
  "channel_code": "agent_a",
  "agent_name": "坐席A",
  "team_name": "一组",
  "account_type": "service"
}
```

### 跳转模式

H5 登记完成后自动跳转到模板链接，支持变量：

- `{lead_uuid}` `{mobile}` `{channel_code}` `{agent_name}` `{team_name}` `{openid}`

### 回调确认

POST `/api/third-party/callback`：

```json
{
  "lead_id": "uuid",
  "third_lead_id": "123",
  "status": "success",
  "sign": "hmac-sha256签名"
}
```

## 生产部署

```bash
# 构建前端
cd wechat-lead-hub/web && npm run build

# 构建并启动后端（会托管 web/dist 静态文件）
cd ../server && npm run build && npm start
```

环境变量：

| 变量 | 说明 |
|------|------|
| `PORT` | 服务端口，默认 4780 |
| `JWT_SECRET` | 管理后台 JWT 密钥 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 管理员账号 |
| `H5_BASE_URL` | H5 页面公网地址 |
| `DEMO_MODE` | 演示模式，生产设为 `false` |
| `SMS_PROVIDER` | `mock` 或真实短信服务商 |

## 目录结构

```
wechat-lead-hub/
├── server/          # Express API + SQLite
│   └── src/
│       ├── routes/      # 微信 Webhook、H5、管理 API
│       └── services/    # 线索、渠道、三方推送
└── web/             # React 管理后台 + H5 承接页
    └── src/pages/
```

## 合规提示

- 金融类引流需遵守平台规范，避免违规承诺收益
- 用户信息采集需有隐私告知与授权
- 生产环境请关闭 `DEMO_MODE`，接入真实短信服务

## License

MIT
