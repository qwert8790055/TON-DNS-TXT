# Deployment Guide

## Option 1: Docker (recommended)

```bash
cp server/.env.example server/.env
# Edit server/.env — set JWT_SECRET, ADMIN_PASSWORD, H5_BASE_URL

docker compose up -d --build
```

Open http://localhost:4780/admin

### With mock third-party (for API mode testing)

```bash
docker compose --profile demo up -d --build
```

Configure third-party in admin:
- Mode: API
- URL: `http://host.docker.internal:4782/api/leads` (Mac/Windows)
  or `http://mock-third-party:4782/api/leads` if on same compose network

View received leads: http://localhost:4782/leads

## Option 2: Manual

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
npm start
```

## Option 3: Development

Terminal 1:
```bash
cd server && cp .env.example .env && npm run dev
```

Terminal 2:
```bash
cd web && npm run dev
```

- API: http://localhost:4780
- Web dev: http://localhost:4781 (proxies /api)

## Production checklist

1. Set `DEMO_MODE=false`
2. Change `JWT_SECRET` and `ADMIN_PASSWORD`
3. Set `H5_BASE_URL` to your public HTTPS domain
4. Configure real WeChat accounts in admin
5. Set WeChat webhook URL: `https://yourdomain.com/api/wechat/{AppID}`
6. Configure WeChat OAuth domain and JS safe domain
7. Replace mock SMS with real provider (edit `server/src/services/smsService.ts`)
8. Use HTTPS reverse proxy (nginx/Caddy)
9. Backup `server/data/lead-hub.db` regularly

## Nginx example

```nginx
server {
    listen 443 ssl;
    server_name lead.example.com;

    location / {
        proxy_pass http://127.0.0.1:4780;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment variables

See `server/.env.example` for full list.

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | Default 4780 |
| JWT_SECRET | Yes (prod) | Admin JWT secret |
| ADMIN_USERNAME | No | Default admin |
| ADMIN_PASSWORD | Yes (prod) | Admin password |
| H5_BASE_URL | Yes (prod) | Public URL for H5 pages |
| DEMO_MODE | No | true for demo data |
| SMS_PROVIDER | No | mock or custom |
