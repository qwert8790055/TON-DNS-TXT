# Week 02 Launch Plan · TON Ecosystem

**Follows**: `content/launch/week-01.md`

---

## Monday — NØ//WEEKLY

```
NØ//WEEKLY — Week 02 · TON

Research Plan
• Publish NØ//RESEARCH-002 (Mini App × Wallet × Domain)
• Deploy Lab Vault on testnet for LAB-001
• Identity binding audit across bot + Mini App

Focus Areas
• TonConnect session vs Telegram initData
• Three-layer identity model
• FunC authorization patterns

Lab / CTF
• Wed 20:00 — NØ//LAB: LAB-001 live exploit + patch
• ID-001 dns_text bindings review

Tooling
• lab/DEPLOY.md — testnet deploy runbook
• /research 002 full
```

---

## Wednesday — NØ//LAB (Lab Vault)

1. OPERATOR deploys `lab/contracts/lab_vault.fc` per `lab/DEPLOY.md`
2. Post testnet address to `[LAB]` bulletin
3. Walk through:
   - Missing `sender == owner` check
   - Craft withdraw message with `@ton/core`
   - Participants drain testnet TON (authorized lab)
4. Group fix: add `throw_unless(403, equal_slice_bits(...))`
5. Optional: deploy patched contract

Bot: `/ctf LAB-001`

---

## Friday — NØ//RESEARCH-002

Publish bulletin from RESEARCH-002 summary section.

Discussion prompts in NØ//CORE · BUILD / MINI APPS:
- Should Mini App send `initData` to backend?
- How does NULL//ORDER link bot `/start` to TonConnect wallet?

---

## Sunday — NØ//REPORT

Track:
- LAB-001 completions
- dns_text verifications (ID-001)
- RESEARCH-002 discussion threads
- Week 03 preview: Jetton CON-001 or fixed vault redeploy

---

## INITIATE Path (Week 02)

Recommended task pairs for promotion:
1. **ID-001** + **DNS-001** (identity + DNS fundamentals)
2. **LAB-001** + **DNS-002** (contract + cell parsing)

Admin verification checklist in RESEARCH-002 §6.1.
