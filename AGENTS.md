# AGENTS.md

Guidance for Cloud Agents working on this repository.

## Project Overview

TON DNS Text Manager — manage `dns_text` records on `.ton` domains.

| Component | Path | Port |
|-----------|------|------|
| Frontend | `client/` | 5173 (dev) |
| API proxy | `server/` | 4727 |
| Production | `135.181.228.18:8080` | nginx → PM2 |

## Security Rules (Mandatory)

1. **Only test authorized assets** — own server and this repo. Never scan third-party sites.
2. **Never commit secrets** — `.env`, passwords, API keys, tokens.
3. **Dynamic verification required** — do not report vulnerabilities without curl/runtime evidence.
4. **No weaponized tooling** — no Cobalt Strike, mass POC dumps, or unauthorized exploit deployment.
5. **Read skill before audit work** — `.cursor/skills/jimi/SKILL.md`

## Development Setup

```bash
# Install (via environment.json)
bash .cursor/install.sh

# Server
cd server && cp .env.example .env && npm run dev

# Client
cd client && cp .env.example .env && npm run dev
```

## Testing

```bash
# Server build
cd server && npm run build

# Client build
cd client && npm run build

# Health check (production)
curl -s -o /dev/null -w "%{http_code}" http://135.181.228.18:8080/
```

## Deployment

Production paths on server:

- Frontend: `/var/www/dns-text/client/`
- API: `/var/www/dns-text/server/` (PM2: `dns-text-api`)
- Nginx: `/etc/nginx/sites-available/dns-text`

See `COMMANDS.md` for full command reference.

## Skill Package

Security audit skill: `.cursor/skills/jimi/`

- Methodology: `references/methodology.md`
- Commands: `COMMANDS.md`
- Reports: `null-order/reports/PENTEST-*.md`

## What NOT to Do

- Attack `hh88vip5.com` or any unauthorized target
- Put SSH passwords in code, commits, or documentation
- Skip rate-limit/CORS hardening when modifying `server/index.ts`
- Claim RCE/SQL/SSRF without verifying architecture has the required sink

## Cursor Cloud Specific Instructions

- Server SSH access is for deploying **this project only**
- Skill uploads go to `/var/www/skills-upload/` on the server
- After server uploads, run `bash scripts/auto-sync-skills.sh`
- Prefer `git push origin master` over force push
- Create branches as `cursor/<name>-0699`
