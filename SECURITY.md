# Security Policy

This document defines security requirements for the TON-DNS-TXT project and its deployment.

## Scope

- Application: React client + Express API proxy
- Production: `135.181.228.18:8080`
- Skill package: `.cursor/skills/jimi/` (authorized audit only)

## Authorization Rules

| Allowed | Forbidden |
|---------|-----------|
| Audit own server `135.181.228.18:8080` | Scan or attack third-party sites |
| Test own repository code | Deploy exploit kits or mass POC databases |
| Harden own infrastructure | Share root passwords in chat or commits |
| Use jimi skill on authorized assets | Cobalt Strike / unauthorized C2 tooling |

## Secrets Handling

- **Never commit** `.env`, API keys, bot tokens, or SSH passwords
- `.env` files are gitignored; use `.env.example` as templates only
- `TONAPI_KEY` and `TONCENTER_KEY` stay server-side only
- `VITE_*` client vars are public after build — do not put secrets there
- Rotate credentials if exposed in chat or logs

## Production Security Controls (Deployed)

| Control | Implementation |
|---------|----------------|
| CORS | Whitelist via `ALLOWED_ORIGINS` |
| Rate limiting | 30 requests/min/IP (`express-rate-limit`) |
| Input validation | TON address format check |
| Error handling | Generic 500 responses |
| Response caching | dns-records 5min TTL |
| Body size limit | JSON 16KB max |
| Nginx headers | nosniff, SAMEORIGIN, Referrer-Policy |
| Firewall | Ports 22, 80, 443, 8080 |

## Reporting Vulnerabilities

1. Run dynamic verification before claiming a finding
2. Document in `null-order/reports/PENTEST-*.md`
3. Fix Medium+ issues before marking deployment complete
4. Re-test after hardening

## Dependency Security

```bash
cd server && npm audit
cd client && npm audit
```

Run after dependency updates. Address High severity issues promptly.

## Incident Response

If credentials are leaked:

1. Rotate `TONAPI_KEY`, `TONCENTER_KEY`, `BOT_TOKEN` immediately
2. Change server root password; prefer SSH keys over passwords
3. Review PM2 and nginx logs: `/root/.pm2/logs/`
4. Re-deploy from clean `master` branch

## Contact

Project owner maintains this repository. Security issues in own deployment should be fixed via PR to `master`.
