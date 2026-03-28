# FlowMate Smart Contracts - Setup Guide

## Overview

FlowMate uses three main Cadence smart contracts to power the autonomous financial system:

1. **FlowMateAgent** - Permissions, autonomy modes, boundaries
2. **VaultManager** - Multi-vault system with balance tracking
3. **ScheduledTransactions** - Flow Forte integration for autonomy

## Project Structure

```
smartcontracts/
├── contracts/                              # Cadence smart contracts
│   ├── FlowMateAgent.cdc                  # Permissions & autonomy
│   ├── VaultManager.cdc                   # Multi-vault management
│   └── ScheduledTransactions.cdc          # Flow Forte scheduled operations
├── transactions/                           # Cadence transaction scripts
│   ├── register_user.cdc                  # Create user account
│   └── transfer_between_vaults.cdc        # Transfer between vaults
├── scripts/                               # Cadence query scripts (read-only)
│   ├── get_user_config.cdc               # Fetch user configuration
│   ├── get_vaults.cdc                    # Fetch vault balances
│   └── get_schedules.cdc                 # Fetch user schedules
└── flow.json                             # Flow CLI configuration
```

## Installation & Setup

### 1. Install Flow CLI

```bash
# macOS
brew install flow-cli

# Linux
sh -ci "$(curl -fsSL https://storage.googleapis.com/flow-cli/install.sh)"

# Windows (via Chocolatey)
choco install flow-cli
```

### 2. Generate Flow Testnet Account

```bash
flow keys generate --network testnet
```

This generates:
- Public Key (to register with faucet)
- Private Key (for .env)

### 3. Request Free FLOW from Faucet

```
https://testnet-faucet.onflow.org

Paste your PUBLIC KEY and request 1000 FLOW
```

### 4. Configure flow.json

Update `smartcontracts/flow.json` with your testnet account:

```json
"accounts": {
  "flow-testnet-account": {
    "address": "0x...",  // Your testnet address
    "key": "..."         // Your private key
  }
}
```

### 5. Deploy Contracts

```bash
flow project deploy --network testnet
```

Output will show:
```
Deploying 3 contracts to testnet

FlowMateAgent     deployed successfully
VaultManager      deployed successfully
ScheduledTransactions deployed successfully
```

Copy the contract addresses and add to `backend/.env`:
```
FLOWMATE_AGENT_CONTRACT=0x...
VAULT_MANAGER_CONTRACT=0x...
SCHEDULED_TRANSACTIONS_CONTRACT=0x...
```

## Smart Contract Details

### FlowMateAgent (410 lines)

**Purpose**: Manage permissions, autonomy modes, and permission boundaries

**Key Structures**:
- `UserConfig` - Autonomy mode, daily limits, whitelisted recipients
- `DelegatedKey` - AI agent authorization with expiry
- `TransactionRecord` - Immutable transaction audit trail

**Key Functions**:
- `registerUser()` - Create user permissions config
- `updateAutonomyMode()` - Switch autonomy mode
- `whitelistRecipient()` - Whitelist recipient address
- `validateTransfer()` - Check if transfer is allowed
- `pauseAutomation()` - Pause agent actions
- `resumeAutomation()` - Resume agent actions

**Autonomy Modes**:
1. **Manual**: User explicitly approves each action
2. **Assist**: AI agent suggests actions, user confirms
3. **Autopilot**: Agent executes actions directly (within boundaries)

### VaultManager (350 lines)

**Purpose**: Multi-vault financial system with balance tracking

**Vault Types**:
- `available` - Daily spending vault
- `savings` - Long-term savings (can lock with deadline)
- `emergency` - Emergency fund (locked with restrictions)
- `staking` - Staked assets (locked)

**Key Functions**:
- `createUserVaults()` - Initialize 4 vaults
- `depositToVault()` - Add funds
- `withdrawFromVault()` - Remove funds (if unlocked)
- `transferBetweenVaults()` - Move between vaults
- `lockVault()` - Lock until timestamp
- `unlockVault()` - Unlock vault
- `getTotalBalance()` - Sum all vaults

**Features**:
- Independent balance per vault type
- Lock/unlock with timestamp constraints
- Prevents withdrawal from locked vaults
- Total balance calculation

### ScheduledTransactions (400 lines)

**Purpose**: Flow Forte integration for autonomous operations

**Schedule Types**:
- `daily` - Every 24 hours
- `weekly` - Every Sunday (or custom day)
- `biweekly` - Every 2 weeks
- `monthly` - Every 30 days
- `custom` - Every N days/weeks/months

**Key Functions**:
- `createSchedule()` - Create new scheduled operation
- `executeSchedule()` - Executed by Flow Forte (on-chain)
- `pauseSchedule()` - Temporarily disable
- `resumeSchedule()` - Reactivate
- `cancelSchedule()` - Delete permanently
- `calculateNextExecution()` - Update next run time

**Execution**:
- Flow Forte calls `executeSchedule()` autonomously
- Executions recorded on-chain with timestamps
- No backend polling needed - purely on-chain
- User sees proof on Flowscan explorer

## Transactions

### register_user.cdc

Atomically:
1. Creates FlowMateAgent user config with autonomy mode
2. Creates 4 vaults (available, savings, emergency, staking)

**Usage**:
```bash
flow transactions send smartcontracts/transactions/register_user.cdc \
  --args-json='{"autonomyMode": "manual"}' \
  --signer=flow-testnet-account \
  --network testnet
```

### transfer_between_vaults.cdc

Transfer funds between user's vaults

**Usage**:
```bash
flow transactions send smartcontracts/transactions/transfer_between_vaults.cdc \
  --args-json='{"from": "available", "to": "savings", "amount": "100.0"}' \
  --signer=flow-testnet-account \
  --network testnet
```

## Scripts (Read-Only)

Scripts fetch data from blockchain without creating transactions.

### get_user_config.cdc

```cadence
import FlowMateAgent from 0xFlowMateAgent

pub fun main(addr: Address): FlowMateAgent.UserConfig {
  return FlowMateAgent.getUserConfig(address: addr) ?? panic("User not found")
}
```

Query:
```bash
flow scripts execute smartcontracts/scripts/get_user_config.cdc 0x... --network testnet
```

### get_vaults.cdc

```cadence
import VaultManager from 0xVaultManager

pub fun main(addr: Address): {String: UFix64} {
  return VaultManager.getUserVaultBalances(address: addr)
}
```

Returns:
```json
{
  "available": 1000.0,
  "savings": 5000.0,
  "emergency": 2000.0,
  "staking": 1500.0
}
```

### get_schedules.cdc

```cadence
import ScheduledTransactions from 0xScheduledTransactions

pub fun main(addr: Address): [ScheduledTransactions.Schedule] {
  return ScheduledTransactions.getUserSchedules(address: addr)
}
```

## Testing

### Local Emulator

```bash
# Start emulator
flow emulator start

# In another terminal, run transaction
flow transactions send smartcontracts/transactions/register_user.cdc \
  --args-json='{"autonomyMode": "manual"}' \
  --signer=emulator-account \
  --network emulator
```

### Testnet

All commands above use `--network testnet`

### Verification

View deployed contracts on Flowscan:
```
https://testnet.flowscan.org/account/0x...
```

View transactions:
```
https://testnet.flowscan.org/transaction/0x...
```

## Key Concepts

### Resource-Oriented Programming

Cadence resources are unique, non-copyable values - perfect for financial assets:

```cadence
pub resource UserVaults {
    pub var vaults: {String: Vault}
    // Can only exist in one place at a time
    // Lost = permanently inaccessible
    // Ideal for preventing accidental duplication
}
```

### Flow Forte Integration

ScheduledTransactions enables autonomous execution:

1. User creates schedule (transaction)
2. Flow Forte monitors schedule
3. When nextExecution timestamp reached, Flow Forte calls executeSchedule()
4. Transaction recorded on-chain
5. User sees proof on Flowscan

**This is the "magic" of FlowMate** - no backend polling, completely autonomous.

### Immutable Audit Trail

Every transaction recorded in on-chain TransactionRecord:
- Timestamp
- Amount
- From/To addresses
- Type (send, swap, stake, etc.)
- Status

User can verify all history on Flowscan explorer.

## Common Operations

### Register New User

```bash
flow transactions send smartcontracts/transactions/register_user.cdc \
  --args-json='{"autonomyMode": "autopilot"}' \
  --signer=flow-testnet-account \
  --network testnet

# Returns transaction ID for verification on Flowscan
```

### Check User Vaults

```bash
flow scripts execute smartcontracts/scripts/get_vaults.cdc 0x... --network testnet
```

### Transfer Between Vaults

```bash
flow transactions send smartcontracts/transactions/transfer_between_vaults.cdc \
  --args-json='{"from": "available", "to": "savings", "amount": "500.0"}' \
  --signer=flow-testnet-account \
  --network testnet
```

## Troubleshooting

### Contract Already Exists
If deploying again, you'll get an error. Either:
1. Update contract and redeploy to a new account
2. Remove old contract first

### Transaction Failed
Check Flowscan explorer for error details:
```
https://testnet.flowscan.org/transaction/0x...
```

### Insufficient Balance
Ensure testnet account has FLOW:
```bash
flow accounts get 0x... --network testnet
```

If empty, request from faucet again.

## Resources

- [Cadence Language Docs](https://docs.onflow.org/cadence)
- [Flow CLI Reference](https://docs.onflow.org/flow-cli)
- [Flowscan Explorer](https://testnet.flowscan.org)
- [Flow Forte Docs](https://docs.onflow.org/flow-forte)
- [FlowMate Backend Integration](/backend/src/config/flow.ts)

## What's Next?

1. ✅ Deploy contracts to testnet
2. Copy contract addresses to backend/.env
3. Start backend server
4. Connect frontend to backend API
5. Test end-to-end (signup → rule → execution → Flowscan verification)
