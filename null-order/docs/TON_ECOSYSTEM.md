# NULL//ORDER × TON Ecosystem

> Authorized TON security research · on-chain identity · builder community

## Positioning

NULL//ORDER is a **TON-native** security research community. All activity anchors to the TON stack:

| Layer | Focus |
|---|---|
| **Identity** | `.ton` DNS · `dns_text` on-chain profiles |
| **Contracts** | FunC · Tact · TVM · Jetton · NFT standards |
| **Apps** | Telegram Mini Apps · TON Connect · TON Sites |
| **Infra** | Validators · liteserver · TON Storage |
| **Security** | Contract audits · wallet security · authorized testnet labs |

Generic web pentest content is out of scope. Research targets **controlled TON environments** (testnet, local TVM, authorized contracts).

---

## TON Stack Map

```
Telegram Mini App ── TON Connect ── Wallet
        │                              │
        └────────── .ton DNS ──────────┘
                      │
              dns_text (on-chain KV)
                      │
         ┌────────────┼────────────┐
         │            │            │
    TON Sites    Jetton/NFT    Smart Contracts
                      │
                    TVM
```

---

## dns_text — On-Chain Community Identity

Members bind Telegram identity to `.ton` domain via `dns_text` records. Any app can resolve profiles without a central DB.

Schema: `config/dns_text_schema.yaml`

| Key | Example | Purpose |
|---|---|---|
| `nullorder.role` | `RESEARCHER` | Community tier |
| `nullorder.telegram` | `@alice` | Telegram handle |
| `nullorder.bio` | `TVM · FunC` | Short bio |
| `nullorder.github` | `https://github.com/alice` | Code / research |
| `channel` | `t.me/nullorder_core` | Public channel |
| `avatar` | `https://…` | Profile image URL |
| `pgp` | `-----BEGIN PGP…` | Encrypted comms |

**Tooling**: use the repo's [TON DNS TXT Mini App](../README.md) (`/tools` in bot) to write records from Telegram.

Verification flow:
1. Member owns `.ton` domain (NFT)
2. Writes `nullorder.telegram` + `nullorder.role` via Mini App
3. Admin verifies on-chain record matches Telegram account
4. `/task <id> dns_text_profile "verified alice.ton"` → counts toward promotion

---

## Content Pillars (TON-only)

| Tag | Content |
|---|---|
| `[TON]` | Ecosystem news — launches, upgrades, TEPs |
| `[CVE]` | TON contract / infra vulnerabilities |
| `[RESEARCH]` | TVM analysis, auth models, Jetton bugs |
| `[LAB]` | Testnet靶场, authorized contract labs |
| `[CTF]` | TON-specific challenges (dns_text, TVM puzzles) |
| `[BUILD]` | Mini Apps, tools, open-source contributions |

---

## Lab Environments (Authorized)

| Environment | Use |
|---|---|
| TON Testnet | Contract deploy, tx analysis |
| Local TVM / sandbox | Opcode debugging, fuzzing |
| Forked mainnet state | Read-only analysis (no unauthorized writes) |
| dns_text lab domain | `lab.nullorder.ton` style controlled targets |

**RULE #01 applies**: testnet and authorized contracts only unless explicit written scope.

---

## INITIATE Tasks (TON)

| Task type | Description |
|---|---|
| `ton_ctf_solve` | Solve a TON CTF challenge with writeup |
| `contract_writeup` | Analyze a testnet contract (auth, logic, gas) |
| `dns_text_profile` | Publish verified `dns_text` community profile |
| `miniapp_contribution` | Ship a Mini App patch or tool |
| `tep_review` | Review / comment on a TEP with technical notes |

Minimum 2 tasks before promotion (configurable in `roles.yaml`).

---

## Weekly TON Series

| Series | Example |
|---|---|
| NØ//WEEKLY | "This week: Jetton auth review + dns_text tooling" |
| NØ//LAB | Deploy vulnerable testnet contract, group exploit + fix |
| NØ//RESEARCH | `NØ//RESEARCH-001` — TON DNS authorization boundary |
| NØ//REPORT | Testnet labs, new `.ton` members, TEP activity |

---

## Integration with This Repo

| Component | Path |
|---|---|
| dns_text Mini App | `/client` + `/server` |
| Telegram Bot (legacy DNS tool) | `/bot` |
| NULL//ORDER community bot | `/null-order/bot` |
| On-chain profile schema | `/null-order/config/dns_text_schema.yaml` |
| Testnet lab contracts | `/null-order/lab/` |
| RESEARCH series | `/null-order/content/research/` |

Launch Mini App from NULL//ORDER bot via `/tools` or the `/start` inline button.

### Research Series

| ID | Topic |
|---|---|
| RESEARCH-001 | TON DNS read/write authorization boundary |
| RESEARCH-002 | Mini App × TonConnect × .ton domain binding |
