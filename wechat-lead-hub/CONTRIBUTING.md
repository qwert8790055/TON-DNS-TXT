# Contributing

Thank you for your interest in contributing to WeChat Lead Hub!

## Development setup

```bash
git clone <repo-url>
cd wechat-lead-hub
./scripts/setup.sh

# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:web
```

## Pull request guidelines

1. Fork the repository and create a feature branch
2. Keep changes focused — one feature or fix per PR
3. Ensure `npm run build` passes
4. Update docs if you change APIs or config
5. Write clear commit messages

## Code style

- TypeScript strict mode
- Match existing patterns in server/services and web/pages
- No unnecessary abstractions

## Reporting issues

Include:
- Steps to reproduce
- Expected vs actual behavior
- Node.js version
- Whether using Docker or manual setup

## Areas for contribution

- Real SMS provider integrations (Aliyun, Tencent Cloud)
- WeChat template message reminders
- Multi-tenant support
- PostgreSQL/MySQL adapter
- English i18n for admin UI
