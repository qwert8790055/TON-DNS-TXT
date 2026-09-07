# API Reference

Base URL: `http://localhost:4780/api`

## Public / H5

### Health check
`GET /health`

### Send SMS code
`POST /h5/sms/send`
```json
{ "mobile": "13800138000" }
```

### Capture lead (after SMS verify)
`POST /h5/capture`
```json
{
  "lead_uuid": "uuid",
  "mobile": "13800138000",
  "code": "123456",
  "name": "optional"
}
```

### Get lead status
`GET /h5/lead/:uuid`

### Demo: simulate WeChat subscribe
`POST /h5/demo/subscribe`
```json
{
  "app_id": "demo_service_001",
  "channel_code": "service_agent_a"
}
```

### OAuth start
`GET /h5/oauth/start?app_id={AppID}&channel={code}`

## WeChat Webhook

### Verify server
`GET /wechat/{app_id}?signature=&timestamp=&nonce=&echostr=`

### Receive events
`POST /wechat/{app_id}`

Handles `subscribe` and `SCAN` events with channel scene parameters.

## Third-party

### Callback (no auth)
`POST /third-party/callback`
```json
{
  "lead_id": "uuid",
  "third_lead_id": "123",
  "status": "success",
  "sign": "hmac-sha256"
}
```

## Admin (Bearer JWT required)

Login: `POST /auth/login` → `{ "token": "..." }`

| Method | Path | Description |
|--------|------|-------------|
| GET | /accounts | List WeChat accounts |
| POST | /accounts | Create account |
| PUT | /accounts/:id | Update account |
| DELETE | /accounts/:id | Delete account |
| GET | /channels | List channels |
| POST | /channels | Create channel + QR |
| POST | /channels/:id/refresh-qrcode | Refresh QR |
| GET | /leads | List leads (paginated) |
| GET | /leads/export | Export CSV |
| POST | /leads/:id/push | Manual re-push |
| GET | /stats/dashboard | Dashboard stats |
| GET | /third-party/configs | List third-party configs |
| POST | /third-party/configs | Create config |
| PUT | /third-party/configs/:id | Update config |
| GET | /third-party/push-logs | Push logs |
| GET | /settings | System settings |
| PUT | /settings | Update settings |

## Lead status flow

```
subscribed → captured → pushing → pushed
                              ↘ push_failed
                              ↘ redirected (redirect mode)
subscribed → duplicate (dedup match)
```

## Third-party push payload (API mode)

```json
{
  "lead_id": "uuid",
  "mobile": "13800138000",
  "openid": "oXXXX",
  "channel_code": "service_agent_a",
  "agent_name": "坐席A",
  "team_name": "一组",
  "account_type": "service",
  "subscribed_at": "2026-08-25T09:00:00.000Z",
  "captured_at": "2026-08-25T09:01:00.000Z"
}
```

Expected response:
```json
{
  "success": true,
  "third_lead_id": "optional-id"
}
```
