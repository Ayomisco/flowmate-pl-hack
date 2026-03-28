# FlowMate Smart Contracts

Cadence 1.0 smart contracts for FlowMate — the autonomous financial operating system on Flow blockchain.

---

## Deployed Contracts (Flow Testnet)

All contracts are deployed at: **`0xc26f3fa2883a46db`**

| Contract | Explorer | Deploy Tx |
|----------|----------|-----------|
| `FlowMateAgent` | [View on Flowscan](https://testnet.flowscan.io/contract/A.c26f3fa2883a46db.FlowMateAgent) | [869c723f](https://testnet.flowscan.io/tx/869c723f3820171a457a2c4a59bd1cf122254daf0f325e46a0ff26e8522aa910) |
| `VaultManager` | [View on Flowscan](https://testnet.flowscan.io/contract/A.c26f3fa2883a46db.VaultManager) | [00010b8e](https://testnet.flowscan.io/tx/00010b8e8e7827ec09f12c149bf89743dd52a67851950dca076c256cc5d1f092) |
| `ScheduledTransactions` | [View on Flowscan](https://testnet.flowscan.io/contract/A.c26f3fa2883a46db.ScheduledTransactions) | [6cfdbf3e](https://testnet.flowscan.io/tx/6cfdbf3ea0d2de37b2a13e5fe0106eb036431909038ec4b7f7fc0ab1e7f19d06) |

### Standard Imports (Testnet)
```cadence
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken     from 0x7e60df042a9c0868
```

---

## Contract Overview

### FlowMateAgent.cdc
The AI agent controller. Each user gets a `UserAccount` resource stored in their account.

**Key features:**
- User registration with autonomy mode (`manual` | `assist` | `autopilot`)
- Daily spend limit enforcement with automatic 24h reset
- Recipient whitelist for trusted addresses
- Full transaction history on-chain
- Delegated key management for autonomous execution

**Events:**
- `UserRegistered(userId, address)`
- `AutonomyModeUpdated(userId, mode)`
- `RecipientWhitelisted(userId, recipient)`
- `TransactionValidated(userId, recipient, amount, allowed)`
- `AutomationPaused(userId)` / `AutomationResumed(userId)`

### VaultManager.cdc
Multi-vault wealth management. Each user gets a `UserVaults` resource with 4 vault types.

**Vault types:** `available` | `savings` | `emergency` | `staking`

**Key features:**
- Per-vault balance tracking
- Time-locked savings vaults
- Atomic vault-to-vault transfers
- Total wealth calculation across all vaults

**Events:**
- `VaultCreated(userId, vaultType)`
- `VaultTransfer(fromVault, toVault, amount)`
- `VaultLocked(userId, vaultType, lockedUntil)`
- `DepositToVault(userId, vaultType, amount)`
- `WithdrawFromVault(userId, vaultType, amount)`

### ScheduledTransactions.cdc
Autonomous execution scheduler. Each user gets a `ScheduleManager` resource.

**Rule types:** `save` | `send` | `dca` | `stake` | `bill`

**Frequencies:** `daily` | `weekly` | `biweekly` | `monthly`

**Key features:**
- Flexible schedule config per rule type
- Execution count tracking and next-execution calculation
- Pause / resume / cancel without losing config
- Execution history with success/fail records

---

## Account Setup

After deploying the contracts, users bootstrap their account with a single transaction:

```bash
flow transactions send smartcontracts/transactions/register_user.cdc \
  --network testnet \
  --signer my-testnet-account \
  --args-json '[{"type":"String","value":"user_001"},{"type":"String","value":"assist"},{"type":"UFix64","value":"1000.0"}]'
```

This creates:
- `FlowMateAgent.UserAccount` stored at `/storage/flowmateUserAccount`
- `VaultManager.UserVaults` stored at `/storage/userVaults`
- Public capabilities at `/public/flowmateUserAccount` and `/public/userVaults`

---

## Read Scripts

```bash
# Get vault balances for an address
flow scripts execute smartcontracts/scripts/get_vaults.cdc \
  --network testnet \
  --args-json '[{"type":"Address","value":"0xc26f3fa2883a46db"}]'

# Get user agent config
flow scripts execute smartcontracts/scripts/get_user_config.cdc \
  --network testnet \
  --args-json '[{"type":"Address","value":"0xc26f3fa2883a46db"}]'

# Get scheduled transactions
flow scripts execute smartcontracts/scripts/get_schedules.cdc \
  --network testnet \
  --args-json '[{"type":"Address","value":"0xc26f3fa2883a46db"}]'
```

---

## Local Development

```bash
# Install Flow CLI
sh -ci "$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)"

# Start local emulator
flow emulator start

# Deploy to emulator
flow project deploy --network emulator

# Deploy to testnet (requires funded account in flow.json)
bash deploy.sh
```

### flow.json Account Config
The testnet account uses `ECDSA_secp256k1` + `SHA2_256`:
```json
"my-testnet-account": {
  "address": "0xc26f3fa2883a46db",
  "key": {
    "type": "hex",
    "index": 0,
    "signatureAlgorithm": "ECDSA_secp256k1",
    "hashAlgorithm": "SHA2_256",
    "privateKey": "<private-key>"
  }
}
```

---

## Cadence 1.0 Notes

These contracts are written in **Cadence 1.0** (not legacy Cadence). Key patterns used:

- `access(all)` replaces `pub`
- `auth(Storage, Capabilities) &Account` replaces `AuthAccount`
- `signer.storage.save()` replaces `signer.save()`
- `signer.capabilities.storage.issue()` replaces `signer.link()`
- Struct fields are value types — mutable fields are stored directly in resources, not nested structs
