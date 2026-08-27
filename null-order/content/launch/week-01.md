# Week 01 Launch Plan · TON Ecosystem

**Dates**: First operational week  
**Series**: NØ//WEEKLY #1

---

## Monday — NØ//WEEKLY

Post to NØ//BULLETIN + pin in NØ//CORE:

```
NØ//WEEKLY — Week 01 · TON

Research Plan
• Publish NØ//RESEARCH-001 (DNS auth boundary)
• Open CTF bank: DNS-001 through CON-001
• dns_text profile binding (ID-001)

Focus Areas
• TON DNS · dns_text · Mini App identity
• Testnet lab setup

Lab / CTF
• Wed 20:00 — NØ//LAB: DNS-001 + DNS-002 group session
• ID-001 identity binding deadline: Sunday

Tooling
• /tools → TON DNS TXT Mini App live
• /ctf · /research · /schema in bot
```

Bot: `/post ton` or paste weekly_plan template.

---

## Daily Content

| Day | Morning [TON] | Morning [CVE/Knowledge] | Afternoon |
|---|---|---|---|
| Mon | TON DNS 101 | dns_text TL-B prefix 0x1eda | Weekly plan discussion |
| Tue | TON Connect Mini Apps | change_dns_record op | DNS-001 solo |
| Wed | Testnet faucet guide | Public read vs owner write | **NØ//LAB** DNS-002 |
| Thu | Jetton TEP-74 overview | Hashmap 256 keys | TVM-001 |
| Fri | **NØ//RESEARCH-001 publish** | Auth boundary summary | Research Q&A |
| Sat | Community tools roundup | — | CON-001 optional |
| Sun | **NØ//REPORT** | — | Week 02 preview |

---

## Wednesday — NØ//LAB Session

```
NØ//LAB — DNS Decode Workshop

When: 20:00 UTC+8
Host: OPERATOR
Network: testnet
Environment: local BOC + testnet domains

Objective
• Solve DNS-001 (key hash) + DNS-002 (cell decode) live
• Walk through @ton/core parseDnsTextRecords

Prerequisites
• Python or Node with @ton/core
• Optional: testnet .ton domain for ID-001

Authorized testnet scope only — RULE #01
```

Bot: `/ctf DNS-001` · `/ctf DNS-002`

---

## Friday — NØ//RESEARCH-001

Publish full bulletin from `content/research/RESEARCH-001.md` bulletin summary section.

Bot admin:
```
/post research
number: 001
title: TON DNS Authorization Boundary Analysis
target: Controlled Lab
network: testnet
category: Access Control
severity: High
overview: (from paper §Executive Summary)
...
/publish
```

Or share: `/research 001 full` in CORE for discussion.

---

## Sunday — NØ//REPORT

```
NØ//REPORT — Week 01 · TON

Members
- New: ___
- dns_text verified: ___
- Promoted: ___

TON Research
- NØ//RESEARCH-001 published
- Auth boundary: write=owner, read=public

Contracts / CVE
- Knowledge: change_dns_record, 0x1eda prefix

Testnet CTF / Lab
- DNS-001/002 lab session
- ID-001 submissions: ___

Tools / Mini Apps
- TON DNS TXT Mini App via /tools

Next Week
- NØ//RESEARCH-002: Mini App wallet-domain binding
- CON-001 jetton reviews
- More testnet CTF
```

---

## INITIATE Checklist (Week 01)

- [ ] `/start` + read RULE #01
- [ ] `/schema` — understand dns_text keys
- [ ] `/tools` — write nullorder.* records (ID-001)
- [ ] Complete 1× CTF (DNS-001 or DNS-002)
- [ ] Intro in NØ//CORE · DNS / IDENTITY topic

Promotion requires 2+ tasks per `roles.yaml`.
