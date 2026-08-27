# NULL//ORDER Community Infrastructure

Authorized security research community + red team lab foundation for Telegram.

```
                 NØ
            NULL//ORDER
                  │
        ┌─────────┴─────────┐
        │                   │
 NØ//BULLETIN          NØ//CORE
   公告频道              核心群
        │                   │
        │            ┌──────┼──────┐
        │            │      │      │
      NEWS        REDTEAM  RESEARCH  LAB
      CVE        VANGUARD  PHANTOM  DEEP CORE
```

## Components

| Path | Purpose |
|---|---|
| `docs/ARCHITECTURE.md` | Full community architecture, roles, ops rhythm |
| `config/` | Roles, channels, content calendar (YAML) |
| `templates/` | Formatted post templates for bulletin & weekly series |
| `bot/` | Telegram bot — onboarding, post formatting, calendar reminders |

## Quick Start

### 1. Telegram Setup

1. Create **NØ//CORE** supergroup (core community)
2. Create **NØ//BULLETIN** channel (admin-only posts)
3. Add `@YourNullOrderBot` as admin in both:
   - Core: manage topics (if used), invite users, restrict members
   - Bulletin: post messages
4. Set group description from `config/channels.yaml`
5. Pin **RULE #01** from `templates/onboarding/rule_01.md`

### 2. Bot

```bash
cd null-order/bot
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill BOT_TOKEN, ADMIN_IDS, BULLETIN_CHANNEL_ID, CORE_GROUP_ID
python bot.py
```

### 3. Admin Commands

| Command | Description |
|---|---|
| `/start` | Onboarding — rules, recruitment, apply as INITIATE |
| `/rules` | Show NULL//ORDER RULE #01 |
| `/recruit` | Show NØ//RECRUITMENT listing |
| `/calendar` | Today's content tasks |
| `/post <type>` | Generate bulletin draft (`news`, `cve`, `research`, `lab`, `ctf`, `recruit`) |
| `/promote <user_id> <role>` | Upgrade member role (tracked in DB) |
| `/status [user_id]` | Show member role & task progress |

## Brand Voice

- **Research-first**: case → principle → risk → lab repro → fix → defense
- **Authorized only**: never position as an attack org
- **Skill > Reputation**: promote on demonstrated work, not hype

## License

MIT — use and adapt for your authorized research community.
