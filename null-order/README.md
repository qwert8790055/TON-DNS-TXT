# NULL//ORDER · TON Ecosystem

Authorized TON security research community with on-chain identity (`dns_text`), testnet labs, and Telegram Mini App integration.

```
                 NØ
            NULL//ORDER
             TON Native
                  │
        ┌─────────┴─────────┐
        │                   │
 NØ//BULLETIN          NØ//CORE
        │                   │
     [TON]            CONTRACTS · DNS
     [CVE]            BUILD · LAB · CTF
   [RESEARCH]
```

## Components

| Path | Purpose |
|---|---|
| `docs/ARCHITECTURE.md` | Community structure, roles, ops rhythm |
| `docs/TON_ECOSYSTEM.md` | TON stack, dns_text schema, lab scope |
| `docs/PENTEST_SKILLS.md` | Penetration testing skills map (general + TON) |
| `config/dns_text_schema.yaml` | On-chain profile key convention |
| `config/ton_stack.yaml` | TON layers, tools, research topics |
| `config/` | Roles, channels, content calendar |
| `templates/` | TON bulletin & weekly post templates |
| `bot/` | Telegram bot — onboarding, tools, calendar |

## TON Integration

- **On-chain identity**: members write `nullorder.*` keys to `.ton` via [TON DNS TXT Mini App](../README.md)
- **Bot `/tools`**: opens Mini App inside Telegram
- **Bot `/schema`**: shows dns_text key schema for profile binding
- **Research scope**: testnet & authorized contracts only (RULE #01)

## Quick Start

### 1. Telegram

1. Create **NØ//CORE** + **NØ//BULLETIN**
2. Set descriptions from `config/channels.yaml`
3. Enable topics: TON, CONTRACTS, DNS, BUILD, RESEARCH, LAB
4. Pin RULE #01 from `templates/onboarding/rule_01.md`

### 2. Bot

```bash
cd null-order/bot
pip install -r requirements.txt
cp .env.example .env
# BOT_TOKEN, ADMIN_IDS, DNS_TEXT_APP_URL, BULLETIN_CHANNEL_ID
python3 bot.py
```

### 3. Commands

| Command | Description |
|---|---|
| `/start` | INITIATE onboarding + Mini App button |
| `/tools` | Open TON DNS TXT Mini App |
| `/schema` | dns_text profile keys |
| `/rules` | RULE #01 (testnet scope) |
| `/recruit` | TON ecosystem recruitment |
| `/calendar` | Today's TON content tasks |
| `/post ton\|cve\|research\|build…` | Bulletin draft |
| `/promote` / `/task` / `/status` | Roles & TON task tracking |

## Brand Voice

- **TON-native**: contracts, TVM, dns_text, Mini Apps — not generic web pentest
- **Research-first**: testnet repro → fix → defense
- **On-chain verify**: `.ton` + `dns_text` over self-claimed handles
- **Authorized only**: mainnet requires explicit written scope

## License

MIT
