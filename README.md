# FlowMate — Autonomous Financial Operating System

> **Say what you want. FlowMate executes.**
> One AI agent. All your money flows. Built on Flow blockchain.

[![Flow Testnet](https://img.shields.io/badge/Flow-Testnet-00EF8B?logo=flow)](https://testnet.flowscan.io/account/0xc26f3fa2883a46db)
[![GitHub](https://img.shields.io/badge/GitHub-flowmate--pl--hack-181717?logo=github)](https://github.com/Ayomisco/flowmate-pl-hack)

---

## The Problem

Managing money today is fragmented and manual:
- 5+ minutes per transaction (open app → enter → approve → confirm)
- 4+ apps for different operations (bank, wallet, DEX, payment)
- Recurring tasks forgotten (savings, bill payments, rebalancing)
- Fear of automation ("What if it drains my wallet?")

## The Solution

FlowMate is an **autonomous financial agent** that lets you express intent in natural language and executes autonomously within your defined boundaries.

```
You: "Save ₦10k by December, 60/40 between savings and emergency fund"

FlowMate:
  → Parses intent with AI
  → Creates two saving rules on-chain
  → Executes every Friday autonomously
  → Notifies you on progress
  → Stops automatically when goal is reached
```

---

## Live Deployed Contracts (Flow Testnet)

All contracts deployed at **`0xc26f3fa2883a46db`**

| Contract | Purpose | Explorer |
|----------|---------|---------|
| `FlowMateAgent` | AI agent config, autonomy modes, spend limits | [flowscan](https://testnet.flowscan.io/contract/A.c26f3fa2883a46db.FlowMateAgent) |
| `VaultManager` | Multi-vault wealth management (save/emergency/stake) | [flowscan](https://testnet.flowscan.io/contract/A.c26f3fa2883a46db.VaultManager) |
| `ScheduledTransactions` | Autonomous execution scheduler | [flowscan](https://testnet.flowscan.io/contract/A.c26f3fa2883a46db.ScheduledTransactions) |

**Deployment transactions:**
- FlowMateAgent → [`869c723f38...`](https://testnet.flowscan.io/tx/869c723f3820171a457a2c4a59bd1cf122254daf0f325e46a0ff26e8522aa910)
- VaultManager → [`00010b8e8e...`](https://testnet.flowscan.io/tx/00010b8e8e7827ec09f12c149bf89743dd52a67851950dca076c256cc5d1f092)
- ScheduledTransactions → [`6cfdbf3ea0...`](https://testnet.flowscan.io/tx/6cfdbf3ea0d2de37b2a13e5fe0106eb036431909038ec4b7f7fc0ab1e7f19d06)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER                                  │
│                  (Web App / Mobile)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ Natural language input
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                    │
│  Login │ Dashboard │ AI Chat │ Autonomy Config │ Profile     │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (JWT auth)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Express + TypeScript)              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  AI Service  │  │ Rule Engine  │  │  Flow Service    │  │
│  │  (Groq/Claude│  │ (Evaluates & │  │  (FCL queries &  │  │
│  │   /Gemini)   │  │  schedules)  │  │   transactions)  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │            │
│  ┌──────▼─────────────────▼────────────────────▼─────────┐  │
│  │           Prisma ORM + PostgreSQL (Neon)               │  │
│  │   Users │ Vaults │ Rules │ Transactions │ ChatHistory  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ @onflow/fcl
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 FLOW BLOCKCHAIN (Testnet)                    │
│                                                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  FlowMateAgent   │  │ VaultManager │  │  Scheduled    │ │
│  │  - Autonomy mode │  │ - 4 vaults   │  │  Transactions │ │
│  │  - Spend limits  │  │ - Lock/unlock│  │  - Scheduler  │ │
│  │  - Whitelist     │  │ - Transfers  │  │  - Execution  │ │
│  └──────────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Cadence 1.0 on Flow Blockchain |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Express.js + TypeScript + Prisma ORM |
| Database | PostgreSQL (Neon serverless) |
| AI | Groq (Mixtral-8x7B) / Claude / Gemini — pluggable |
| Auth | JWT + Magic Link (walletless) |
| Blockchain SDK | @onflow/fcl v1.4 |

---

## Features

### For Users
- **Natural language commands** — "Send 50 FLOW to Alex every month"
- **4-vault system** — Available, Savings, Emergency, Staking
- **3 autonomy modes** — Manual, Assisted, Autonomous (autopilot)
- **Daily spend limits** — Configurable per-user guard rails
- **Whitelisted recipients** — Only trusted addresses for auto-send
- **Savings goals** — Set targets, agent optimizes toward them

### On-Chain
- User agent config and limits stored on Flow (immutable, auditable)
- All vault operations recorded as blockchain transactions
- Schedule execution anchored to block timestamps
- Full transaction history verifiable on-chain

---

## Project Structure

```
flowmate-pl-hack/
├── frontend/          # React + Vite app (port 8080)
│   └── src/
│       ├── pages/     # Login, Dashboard, Chat, Config, Profile
│       ├── components/# SendModal, ReceiveModal, BottomNav
│       ├── hooks/     # useAuth, use-mobile
│       └── lib/       # api.ts (axios service)
├── backend/           # Express API (port 3000)
│   └── src/
│       ├── routes/    # auth, user, vault, chat, transaction
│       ├── services/  # ai, flow, rule-engine, transaction
│       ├── middleware/# auth (JWT), cors, rate-limit
│       └── config/    # env, flow (FCL), logger
├── smartcontracts/    # Cadence 1.0 contracts
│   ├── contracts/     # FlowMateAgent, VaultManager, ScheduledTransactions
│   ├── transactions/  # register_user, transfer_between_vaults
│   ├── scripts/       # get_vaults, get_user_config, get_schedules
│   └── flow.json      # Flow CLI config
└── docs/              # PRD, architecture notes
```

---

## Quick Start

### Prerequisites
- Node.js 18+, npm/bun
- Flow CLI (`sh -ci "$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)"`)

### Backend
```bash
cd backend
cp .env.example .env    # Fill in your keys
npm install
npx prisma migrate dev  # Run DB migrations
npm run dev             # Starts on port 3000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env    # Set VITE_API_URL=http://localhost:3000
npm run dev             # Starts on port 8080
```

### Smart Contracts (already deployed — read-only interaction)
```bash
cd smartcontracts

# Query vault balances
flow scripts execute scripts/get_vaults.cdc \
  --network testnet \
  --args-json '[{"type":"Address","value":"0xc26f3fa2883a46db"}]'

# Query user config
flow scripts execute scripts/get_user_config.cdc \
  --network testnet \
  --args-json '[{"type":"Address","value":"0xc26f3fa2883a46db"}]'
```

---

## Testing as a Judge

1. Visit the live frontend (see GitHub Pages / Vercel link)
2. Sign in with any email → lands on Dashboard
3. Navigate to **Chat** → type "Save $200 weekly to my savings vault"
4. Watch the AI parse the intent and respond with an action card
5. Navigate to **Config** → change autonomy mode → refreshes persisted
6. Check contracts live on [Flowscan Testnet](https://testnet.flowscan.io/account/0xc26f3fa2883a46db?tab=contracts)

---

## Hackathon

Built for **PL Genesis Hacks** — Flow Track.

**Team:** FlowMate

**Repository:** [github.com/Ayomisco/flowmate-pl-hack](https://github.com/Ayomisco/flowmate-pl-hack)
