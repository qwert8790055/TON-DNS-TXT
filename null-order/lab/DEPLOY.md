# Deploy Lab Vault on Testnet

## Prerequisites

- Testnet TON ([faucet](https://testnet.tonhub.com/faucet))
- Node.js 18+
- `npm create ton@latest` (Blueprint) **or** [TON IDE](https://ide.ton.org)

---

## Option A — TON Blueprint (recommended)

### 1. Scaffold

```bash
cd null-order/lab
npm create ton@latest deploy -- --type func-empty
cd deploy
npm install
```

### 2. Copy contract

Replace `contracts/` content with `../contracts/lab_vault.fc` and ensure `stdlib.fc` import path matches Blueprint layout (`imports/stdlib.fc`).

### 3. Add deploy script

In `scripts/deployLabVault.ts`:

```typescript
import { toNano } from '@ton/core';
import { LabVault } from '../wrappers/LabVault';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
  const code = await compile('LabVault');
  const labVault = provider.open(
    LabVault.createFromConfig(
      { owner: provider.sender().address! },
      code
    )
  );
  await labVault.sendDeploy(provider.sender(), toNano('0.05'));
  await provider.waitForDeploy(labVault.address);
  console.log('LabVault deployed at', labVault.address.toString());
}
```

Generate wrapper with Blueprint or deploy manually via TON IDE.

### 4. Deploy testnet

```bash
npx blueprint run deployLabVault --testnet
```

Save deployed address for CTF participants.

### 5. Fund vault

Send ≥ 0.1 testnet TON to contract address (deposit).

---

## Option B — TON IDE (no local setup)

1. Open [ide.ton.org](https://ide.ton.org) → testnet
2. Paste `contracts/lab_vault.fc`
3. Add stdlib from template
4. Deploy with init data: owner address (slice)
5. Publish address to NØ//CORE · LAB

---

## Verify Deployment

```bash
# get-method owner
toncli get owner <ADDRESS> --testnet

# get-method balance
toncli get balance <ADDRESS> --testnet
```

Or use [testnet.tonviewer.com](https://testnet.tonviewer.com).

---

## CTF Operations (admin)

1. Deploy one shared lab instance per NØ//LAB session
2. Post address in NØ//BULLETIN `[LAB]` tag
3. Participants exploit on testnet, submit writeup
4. Admin: `/task <user_id> ton_ctf_solve LAB-001`

---

## Teardown

After lab session, drain remaining testnet TON back to ops wallet. Do not reuse vulnerable bytecode on mainnet.
