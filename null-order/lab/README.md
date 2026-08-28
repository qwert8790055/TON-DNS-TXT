# NULL//ORDER Testnet Lab Contracts

Authorized **testnet-only** contracts for NØ//LAB and CTF challenges.

> **RULE #01**: Deploy and exploit on testnet only. Never mainnet.

## Contracts

| Contract | File | Purpose |
|---|---|---|
| Lab Vault | `contracts/lab_vault.fc` | Missing auth on `withdraw` — LAB-001 CTF |

## Quick Start

See [DEPLOY.md](./DEPLOY.md) for full steps.

```bash
# Requires TON Blueprint (recommended)
npm create ton@latest null-order-lab-deploy -- --type func-empty
# Copy lab_vault.fc into contracts/ and follow DEPLOY.md
```

## Message Format (Lab Vault)

### Deposit

Send TON to contract address with empty body, or op `0x1001`.

### Withdraw (vulnerable)

```
op:   0x1002  (32 bits)
amount: Coins
dest: MsgAddress
```

Any sender can drain contract balance on testnet lab instance.

## CTF

- **LAB-001**: Exploit + write fix → `content/ctf/LAB-001.md`
- **CON-001**: Jetton audit (optional alternative to lab vault)

### Exploit helper (testnet)

```bash
cd null-order/lab
npm install
node scripts/exploit_withdraw.mjs <LAB_ADDRESS> <YOUR_WALLET> 0.05
```

Use output BOC as message body when sending tx to lab contract.

## Fix Pattern

Add before `send_raw_message`:

```func
throw_unless(403, equal_slice_bits(sender_address, owner));
```

Compare with fixed contract in writeup.

## Links

- [TON FunC docs](https://docs.ton.org/develop/func/overview)
- [Blueprint](https://github.com/ton-org/blueprint)
- NØ//RESEARCH-001 / RESEARCH-002
