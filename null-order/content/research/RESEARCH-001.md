# NØ//RESEARCH-001

## TON DNS Authorization Boundary Analysis

| Field | Value |
|---|---|
| **Target** | Controlled Lab · TON DNS NFT Item |
| **Network** | testnet / read-only mainnet analysis |
| **Category** | Access Control · Identity Binding |
| **Severity** | High (when misapplied) |
| **Author** | NULL//ORDER |
| **Date** | 2026-08-27 |

---

## Executive Summary

TON DNS domains are NFTs. Each `.ton` domain stores DNS records — including `dns_text` key/value pairs — inside the NFT item contract. **Write access is correctly gated by NFT ownership** via the `change_dns_record` op. However, **read access is fully public** via `dnsresolve`. Applications that treat `dns_text` as authenticated identity without verifying ownership create an **authorization boundary failure** at the app layer, not the chain layer.

This research defines where TON DNS authorization holds, where it breaks, and how NULL//ORDER binds Telegram identity on-chain.

---

## 1. Background — TON DNS Record Model

### 1.1 Domain as NFT

A `.ton` domain is an NFT item contract. The owner (wallet holding the NFT) controls all DNS records stored in a `Hashmap 256 DNSRecord` inside the contract.

### 1.2 dns_text Record Type

`dns_text` records use TL-B prefix `0x1eda`:

```
dns_text#1eda _:Text = DNSRecord;
```

- **Key**: free-form string (e.g. `nullorder.telegram`), stored on-chain as `sha256(key_name)`
- **Value**: UTF-8 text, up to 123 bytes per cell (longer values chain via refs)
- **Visibility**: public — anyone can call `dnsresolve(category=0)` and read all records

Reference implementation in this repo:

```127:138:client/src/lib/dnsText.ts
export function buildChangeDnsRecord(categoryKey: bigint, value: Cell | null): Cell {
  const builder = beginCell()
    .storeUint(CHANGE_DNS_RECORD_OP, 32)
    .storeUint(0n, 64)
    .storeUint(categoryKey, 256);

  if (value !== null) {
    builder.storeRef(value);
  }
  // No ref = deletion (contract checks: has_value = in_msg_body.slice_refs() > 0)

  return builder.endCell();
}
```

---

## 2. Authorization Boundaries

### 2.1 On-Chain Write Boundary — STRONG

| Action | Who can do it | Mechanism |
|---|---|---|
| Set `dns_text` | NFT owner only | `change_dns_record` (op `0x4eb1f0f9`) |
| Delete `dns_text` | NFT owner only | Same op, no value ref |
| Read all records | Anyone | `dnsresolve` get-method (free, no auth) |

The contract enforces ownership at write time. Unauthorized wallets cannot modify another domain's records.

**Conclusion**: TON DNS write authorization is sound at the protocol level.

### 2.2 On-Chain Read Boundary — PUBLIC BY DESIGN

Reading requires no wallet, no signature, no fee beyond the RPC call:

```16:36:server/routes/dnsRecords.ts
router.get('/dns-records', async (req: Request, res: Response) => {
  // ...
  // Calls dnsresolve(category=0) on the NFT item
  method: 'dnsresolve',
  stack: [
    ['tvm.Slice', NULL_BYTE_BOC],
    ['num', '0'],
  ],
```

Any indexer, Mini App, or bot can resolve `nullorder.telegram`, `avatar`, `channel`, or any custom key from any `.ton` domain.

**Conclusion**: `dns_text` is a **public bulletin board**, not a private credential store.

### 2.3 Application-Layer Boundary — WHERE FAILURES OCCUR

| Failure Mode | Description | Risk |
|---|---|---|
| **Trust without ownership proof** | App reads `nullorder.telegram=@alice` and grants access without verifying caller owns the domain | Impersonation if attacker controls a different domain |
| **Key hash opacity** | Apps display records but cannot reverse `sha256(key)` — users can't audit what keys exist | Schema confusion, wrong key written |
| **Off-chain role mapping** | Bot DB role ≠ on-chain `nullorder.role` without verification | Privilege drift |
| **Stale record trust** | App caches old `dns_text` after domain transfer | New owner inherits old identity claims |

---

## 3. Case Study — NULL//ORDER Identity Binding

### 3.1 Intended Flow

```
Member owns alice.ton
    → writes nullorder.telegram=@alice via Mini App (TonConnect)
    → writes nullorder.role=INITIATE
Admin verifies:
    → dnsresolve(alice.ton NFT) returns nullorder.telegram=@alice
    → Telegram @alice matches
    → /task <id> dns_text_profile alice.ton
```

### 3.2 Attack Scenarios (Controlled Lab)

**Scenario A — Wrong domain, right username**

Attacker owns `fake-alice.ton`, writes `nullorder.telegram=@alice`.
If admin only checks username match without domain allowlist → false binding.

**Mitigation**: verify specific domain ownership + optional community allowlist of verified domains.

**Scenario B — Domain transfer**

`alice.ton` sold/transferred. Old `nullorder.role=RESEARCHER` still on-chain.
If app auto-trusts on-chain role → new owner inherits RESEARCHER privileges.

**Mitigation**: re-verification on role change; timestamp or version key (`nullorder.verified_at`).

**Scenario C — Read-only trust in Mini Apps**

Mini App reads dns_text from a domain the connected wallet does **not** own, but UI implies ownership.

**Mitigation**: TonConnect wallet address must match NFT owner from chain state before write; for read-only display, label as "claimed by domain X" not "your profile".

---

## 4. Root Cause Analysis

The authorization boundary failure is **not** in TON DNS contracts. It occurs when:

1. **Readers treat public data as authenticated assertions** without binding reader ↔ owner
2. **Apps skip NFT ownership check** between wallet connect and privilege grant
3. **No re-verification** after domain transfer or role promotion

Formula:

```
Effective Auth = NFT_Ownership (write) + App_Verification (read trust)
```

Most apps implement only the first half.

---

## 5. Reproduction (Controlled Lab)

### Prerequisites

- TON testnet wallet with test TON
- Testnet `.ton` domain (or sandbox NFT item)
- This repo's Mini App or manual `change_dns_record` via TonConnect

### Steps

1. **Deploy/read lab domain** — resolve NFT item address for `lab-test.ton` (testnet)
2. **Write identity record**:
   - Key: `nullorder.telegram`
   - Value: `@lab_user`
3. **Public read** (no auth):
   ```bash
   curl "https://your-api/api/dns-records?address=<nft-item-address>"
   ```
4. **Verify write rejection** — send `change_dns_record` from non-owner wallet → transaction fails
5. **Simulate app-layer failure** — grant bot role based on read alone, without `/task` verification

### Expected Results

| Step | Result |
|---|---|
| Owner write | Success |
| Non-owner write | Revert |
| Public read | Returns all dns_text records |
| Role grant without verification | **Vulnerability demo** — should fail in production |

---

## 6. Remediation

### 6.1 For Application Developers

```typescript
// Pseudocode — verified identity binding
async function verifyDomainIdentity(domain: string, wallet: string, telegram: string) {
  const nftAddress = await resolveNftItem(domain);
  const owner = await getNftOwner(nftAddress);
  if (owner !== wallet) return { ok: false, reason: 'wallet_not_owner' };

  const records = await dnsresolve(nftAddress);
  const claimed = records.get('nullorder.telegram');
  if (claimed !== telegram) return { ok: false, reason: 'telegram_mismatch' };

  return { ok: true, domain, wallet, telegram };
}
```

### 6.2 Recommended dns_text Keys for Verified Profiles

| Key | Purpose |
|---|---|
| `nullorder.telegram` | Claimed Telegram handle |
| `nullorder.role` | Community tier (informational until verified) |
| `nullorder.verified_at` | ISO timestamp of last admin verification |
| `nullorder.version` | Schema version (e.g. `1`) |

See `config/dns_text_schema.yaml` for full schema.

### 6.3 For NULL//ORDER Bot

- Never auto-promote from on-chain `nullorder.role` alone
- Require admin `/task dns_text_profile <domain>` after manual verification
- Periodic re-check on promotion to ARCHITECT/MODERATOR

---

## 7. Defense Summary

| Layer | Control |
|---|---|
| **Chain write** | NFT ownership (built-in) |
| **Chain read** | Assume public — no secrets in dns_text |
| **App verify** | Wallet = owner, telegram = claim, admin attestation |
| **Ops** | Re-verify on domain transfer, pin RULE #01 for testnet scope |

---

## 8. References

- [TON DNS](https://dns.ton.org)
- [TEPs / TON DNS standard](https://github.com/ton-blockchain/TEPs)
- [This repo — dns_text read/write](../README.md)
- NULL//ORDER dns_text schema: `config/dns_text_schema.yaml`

---

## Bulletin Summary (for NØ//BULLETIN)

```
[RESEARCH] NØ//RESEARCH-001

TON DNS Authorization Boundary Analysis

Target: Controlled Lab
Category: Access Control
Severity: High (app-layer misapplication)

TON DNS write auth is strong (NFT owner only).
dns_text read is public — apps must verify ownership
before trusting on-chain identity claims.

Case → TVM/contract model → read/write boundary →
testnet repro → verification pattern → defense.

Full paper: null-order/content/research/RESEARCH-001.md
```

— NULL//ORDER · TON Ecosystem · NØ//RESEARCH
