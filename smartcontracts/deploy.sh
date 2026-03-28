#!/bin/bash
# Manual Flow Contract Deployment Script
# This deploys contracts to Flow testnet account 0xc26f3fa2883a46db

set -e

ACCOUNT_NAME="my-testnet-account"
NETWORK="testnet"

echo "Deploying FlowMate contracts to Flow $NETWORK..."
echo ""

echo "1. Deploying FlowMateAgent..."
flow accounts add-contract \
  --network $NETWORK \
  --signer $ACCOUNT_NAME \
  contracts/FlowMateAgent.cdc

echo "2. Deploying VaultManager..."
flow accounts add-contract \
  --network $NETWORK \
  --signer $ACCOUNT_NAME \
  contracts/VaultManager.cdc

echo "3. Deploying ScheduledTransactions..."
flow accounts add-contract \
  --network $NETWORK \
  --signer $ACCOUNT_NAME \
  contracts/ScheduledTransactions.cdc

echo ""
echo "All contracts deployed successfully!"
echo "All contracts live at: 0xc26f3fa2883a46db"
echo ""
echo "Update backend/.env:"
echo "  FLOWMATE_AGENT_CONTRACT=0xc26f3fa2883a46db"
echo "  VAULT_MANAGER_CONTRACT=0xc26f3fa2883a46db"
echo "  SCHEDULED_TRANSACTIONS_CONTRACT=0xc26f3fa2883a46db"
