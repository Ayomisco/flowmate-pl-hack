# FlowMate Smart Contracts

Flow blockchain smart contracts for the FlowMate autonomous financial operating system.

## Contracts

### FlowMateAgent.cdc
- User registration and configuration
- Autonomy mode management (manual, assist, autopilot)
- Daily transaction limits and reset logic
- Recipient whitelisting
- Delegated authorization for agent operations
- Complete transaction history

### VaultManager.cdc
- Multi-vault system (available, savings, emergency, staking)
- Vault locking mechanism for savings goals
- Balance tracking per vault type
- Vault-to-vault transfers
- Total wealth calculation

### ScheduledTransactions.cdc
- Flow Forte integration for autonomous execution
- Schedule creation for all operation types (save, send, dca, stake, bill)
- Automatic next execution calculation based on frequency
- Execution history tracking
- Schedule pause/resume/cancel functionality

## Setup

```bash
# Update .env with Flow credentials
cp .env.example .env

# Install Flow CLI
brew install flow-cli

# Deploy contracts to Flow testnet
flow project deploy --network testnet
```

## Transactions

- `register_user.cdc` - Bootstrap user with FlowMateAgent and VaultManager

## Deployment Notes

- All contract imports must be updated with actual deployed addresses
- DefaultToken (FLOW) is FlowToken from mainnet: 0x7e60df042a9c0868
- FungibleToken standard at: 0xf233dcee88fe0abe
