# NØ//RESEARCH-002

## Telegram Mini App × TonConnect × .ton Domain Binding

| Field | Value |
|---|---|
| **Target** | TON DNS TXT Mini App (this repo) |
| **Network** | testnet / Mini App sandbox |
| **Category** | Identity · Session · Wallet Binding |
| **Severity** | High (when layers are conflated) |
| **Author** | NULL//ORDER |
| **Date** | 2026-08-28 |
| **Builds on** | [RESEARCH-001](./RESEARCH-001.md) |

---

## Executive Summary

Telegram Mini Apps, TonConnect wallets, and `.ton` DNS domains represent **three independent identity layers**. The TON DNS TXT Mini App in this repo correctly binds **writes** to wallet-owned domains via TonConnect + on-chain NFT checks, but **does not bind Telegram identity to wallet or domain** at the application layer.

Confusing these layers causes privilege escalation in community systems (e.g. granting NULL//ORDER roles from Telegram alone, or from `dns_text` reads without wallet verification).

This paper maps each layer, analyzes the Mini App trust model, and specifies a verified binding protocol for NULL//ORDER.

---

## 1. Three Identity Layers

```
┌─────────────────────┐
│  Telegram Layer     │  WebApp initData → user id, @username
│  (Mini App host)    │  NOT verified in this client
└──────────┬──────────┘
           │ separate
┌──────────▼──────────┐
│  Wallet Layer       │  TonConnect → wallet address, signs txs
│  (TonConnect)       │  Required for writes
└──────────┬──────────┘
           │ must match NFT owner for writes
┌──────────▼──────────┐
│  Domain Layer       │  .ton NFT → dns_text records
│  (TON DNS)          │  Public read, owner-only write
└─────────────────────┘
```

| Layer | Source | Proves | Used for in Mini App |
|---|---|---|---|
| Telegram | `window.Telegram.WebApp` | User is in Telegram chat with bot | UI chrome, haptics, MainButton |
| Wallet | TonConnect session | User controls signing keys | Domain list, tx signing |
| Domain | TON DNS NFT + dns_text | User owns domain content (if verified) | Record read/write target |

**Critical insight**: Connecting a wallet does **not** prove Telegram `@username`. Opening the Mini App does **not** prove wallet ownership of a displayed domain until a signed transaction succeeds or off-chain owner check passes.

---

## 2. Mini App Architecture (This Repo)

### 2.1 Telegram Integration — Presentation Only

```21:25:client/src/App.tsx
  useEffect(() => {
    tgReady();
    tgExpand();
    tgRequestFullscreen();
  }, []);
```

`client/src/lib/telegram.ts` wraps WebApp APIs (MainButton, BackButton, haptics). **No `initData` is read or sent to the backend.** Telegram user identity is not part of the write path.

Implication: NULL//ORDER bot knows `user_id` from Telegram; Mini App knows `wallet` from TonConnect. **These are not linked automatically.**

### 2.2 Wallet → Domain Binding — STRONG (Write Path)

Step 1: Domains fetched only for connected wallet:

```23:29:client/src/hooks/useDomains.ts
    fetch(`/api/domains?wallet=${encodeURIComponent(walletAddress)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ domains: Domain[] }>;
      })
      .then(data => {
        if (!cancelled) setDomains(data.domains ?? []);
```

Step 2: User selects a domain from **their** NFT list (TONAPI DNS collection query in `server/routes/domains.ts`).

Step 3: Write sends `change_dns_record` to the NFT item; **contract rejects non-owner**:

```36:55:client/src/components/RecordEditor.tsx
  async function sendTx(body: import('@ton/core').Cell) {
    const destAddress = Address.parse(domain.address).toString({ bounceable: true });
    // ...
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages,
      });
```

**Conclusion**: User cannot write `dns_text` to a domain they do not own. UI only lists owned domains. Write auth is sound.

### 2.3 Domain Read Path — PUBLIC (Any Domain)

`useDnsRecords` calls `/api/dns-records?address=<nft>` with **no wallet parameter**. Anyone (browser or Mini App) can read any domain's records if they know the NFT address.

This is correct for a DNS manager but dangerous if the same UI implies "your profile" when displaying another domain's `nullorder.telegram`.

### 2.4 Key Name Display — Local Trust

```11:16:client/src/lib/keyStore.ts
export function saveKeyName(keyHash: string, keyName: string): void {
  const store = load();
  store[keyHash] = keyName;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
```

Key names are cached in **localStorage** after user writes. Reading records from chain yields hashes only — key names come from local cache or user memory.

Implication: two users viewing the same domain may see different key labels. Security does not depend on this, but **auditing** requires off-chain key knowledge.

---

## 3. Failure Modes

### 3.1 Telegram ≠ Wallet

| Scenario | Risk |
|---|---|
| Bot grants role from `/start` Telegram id only | Anyone with Telegram account joins as INITIATE — OK if expected |
| Bot grants role from `dns_text` read without wallet proof | Attacker sets records on **their** domain claiming victim's `@username` |
| Mini App shows "Connected" wallet but bot never sees it | Bot DB and on-chain state diverge |

**Mitigation**: NULL//ORDER verification requires all three: Telegram id + wallet owner + matching `nullorder.telegram` on-chain (see §6).

### 3.2 Wallet Connected ≠ Domain Claim Displayed

Mini App never shows domains the wallet doesn't own in the write flow. Failure occurs in **external apps** that:

1. Accept manual `.ton` name input
2. Resolve and display `dns_text` as "authenticated profile"
3. Skip TonConnect owner check

### 3.3 initData Forgery (If Backend Added Later)

If a future backend accepts `Telegram.WebApp.initData` without HMAC validation (bot token hash), clients can forge Telegram identity.

**Mitigation** (when implementing server-side Telegram auth):

```python
# Verify initData per Telegram docs
# secret_key = HMAC_SHA256("WebAppData", bot_token)
# data_check_string = sorted key=value pairs
# HMAC_SHA256(secret_key, data_check_string) == hash param
```

This repo currently has **no server-side Telegram auth** — lowest attack surface, but no Telegram-wallet binding in-app.

### 3.4 Session Fixation Across Layers

User A connects wallet on shared device, disconnects TonConnect but localStorage key cache remains. User B sees key labels from A's session.

**Mitigation**: clear localStorage on wallet disconnect; label data as user-specific.

---

## 4. Root Cause

Authorization failures occur when products **collapse layers**:

```
Bad:  Telegram user ──► trust dns_text ──► grant role
Bad:  Wallet connected ──► assume any resolved domain is "mine"
Good: Telegram + wallet owner + dns_text match + admin attestation
```

The Mini App implements **Good** for writes (wallet → owned domain → chain enforces). NULL//ORDER bot must implement **Good** for community roles (cannot rely on Mini App alone).

---

## 5. Reproduction (Controlled Lab)

### Lab A — Write boundary (expect success/fail correctly)

1. Open Mini App via NULL//ORDER bot `/tools`
2. Connect testnet wallet with domain `alice.ton`
3. Write `nullorder.telegram` = `@alice`
4. Connect different wallet without `alice.ton`
5. Confirm `alice.ton` **not** in domain list; manual tx to NFT address **reverts**

### Lab B — Read vs trust (expect app-layer failure demo)

1. Attacker wallet owns `attacker.ton`
2. Writes `nullorder.telegram` = `@victim`
3. NULL//ORDER bot reads record via API (no auth)
4. If bot auto-grants → **vulnerability demo**
5. Correct: admin rejects; requires victim wallet signature or admin `/task` after manual verify

### Lab C — Layer diagram audit

Trace data flow for `/start` → `/tools` → write → `/task dns_text_profile`:

| Step | Layer | Verified? |
|---|---|---|
| `/start` | Telegram | Bot only |
| TonConnect | Wallet | User signature |
| Domain list | Wallet → NFT | TONAPI ownership |
| `change_dns_record` | Chain | NFT contract |
| `/task` | Admin | Manual |

Document gaps between steps.

---

## 6. Remediation — NULL//ORDER Verified Binding

### 6.1 Protocol

```
1. User: /start (Telegram id registered as INITIATE)
2. User: /tools → connect wallet W
3. User: write to domain D:
     nullorder.telegram = @handle matching Telegram
     nullorder.role = INITIATE
     nullorder.version = 1
4. Admin verifies:
     owner(D) == W                    (TONAPI get NFT owner)
     dnsresolve(D).nullorder.telegram == @handle
     @handle matches Telegram user_id
5. Admin: /task <id> dns_text_profile D
6. Optional: user writes nullorder.verified_at after admin approval
```

### 6.2 Mini App Hardening (Recommended)

| Change | Priority | Effort |
|---|---|---|
| Show connected wallet address prominently | High | Low |
| Warn when viewing domain not in owned list (if add lookup) | Medium | Medium |
| Clear keyStore on TonConnect disconnect | Medium | Low |
| Pass `initData` to backend with HMAC verify for bot linking | High | Medium |
| Deep link: `?bind=<telegram_user_id>` for bot-initiated sessions | Low | Medium |

### 6.3 Bot Hardening

- `/status` shows: Telegram role, tasks, **on-chain verification state** (pending/verified)
- Never promote from `nullorder.role` on-chain value alone
- Re-verify on wallet change or domain transfer

---

## 7. Defense Summary

| Layer | Control |
|---|---|
| Telegram | Verify initData server-side when linking accounts |
| Wallet | TonConnect for all writes; show address in UI |
| Domain write | NFT contract (built-in) |
| Domain read trust | Admin verification + `nullorder.verified_at` |
| Community role | Bot DB + `/task`, not dns_text alone |

---

## 8. References

- [RESEARCH-001](./RESEARCH-001.md) — DNS read/write boundaries
- [Telegram Mini Apps — initData](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
- [TonConnect documentation](https://docs.ton.org/develop/dapps/ton-connect/overview)
- `client/src/App.tsx`, `RecordEditor.tsx`, `useDomains.ts`
- `config/dns_text_schema.yaml`

---

## Bulletin Summary

```
[RESEARCH] NØ//RESEARCH-002

Telegram Mini App × TonConnect × .ton Domain Binding

Target: TON DNS TXT Mini App
Category: Identity · Session Binding
Severity: High (layer conflation)

Three independent layers: Telegram, Wallet, Domain.
Mini App writes are safe (owner-only via TonConnect).
Community roles must verify all three + admin attestation.

Full paper: null-order/content/research/RESEARCH-002.md
```

— NULL//ORDER · TON Ecosystem · NØ//RESEARCH
