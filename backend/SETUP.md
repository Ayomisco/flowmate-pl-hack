# FlowMate - Backend Setup Guide

## ✅ What's Ready

- **Cadence Smart Contracts** (3 contracts)
  - `FlowMateAgent.cdc` - User permissions, delegation, boundary enforcement
  - `VaultManager.cdc` - Multi-vault system (Available, Savings, Emergency, Staking)
  - `ScheduledTransactions.cdc` - Flow Forte integration for automation

- **Express.js Backend** (Full scaffold)
  - TypeScript configuration
  - Database schema (Prisma ORM)
  - Security middleware (Helmet, CORS, Rate Limiting)
  - Logger setup (Winston)
  - Environment configuration

- **Database** (PostgreSQL via NeonDB)
  - 9 tables with proper indexing
  - Foreign key relationships
  - Initial migration ready

## 📋 What You Need to Provide

### 1. **NeonDB PostgreSQL Connection**
You mentioned providing a NeonDB URL. You need:
```
DATABASE_URL=postgresql://user:password@aws-us-east-1.neon.tech/flowmate?sslmode=require
```

**How to get it:**
- Go to https://console.neon.tech
- Create a new database "flowmate"
- Copy connection string
- Paste into `.env` as `DATABASE_URL`

### 2. **Flow Blockchain Testnet Account**
For deploying contracts and executing transactions:
```
FLOW_ACCOUNT_ADDRESS=0xyouraddress
FLOW_ACCOUNT_PRIVATE_KEY=yourprivatekey
```

**How to get it:**
```bash
# Install Flow CLI
brew install flow-cli  # macOS
# or see: https://developers.flow.com/tools/flow-cli/install

# Generate new account for testnet
flow keys generate

# You'll get a public key, use it to request testnet FLOW:
# https://testnet-faucet.onflow.org
```

### 3. **Magic Link API Keys**
For walletless authentication:
```
MAGIC_API_KEY=pk_live_...
MAGIC_SECRET_KEY=...
```

**How to get it:**
- Sign up: https://magic.link
- Create project (select "Flow" blockchain)
- Copy API key from dashboard

### 4. **AI Provider API Key** (Choose ONE)
```bash
# Option A: Claude (Recommended)
CLAUDE_API_KEY=sk-ant-...

# Option B: Gemini (Free tier)
GEMINI_API_KEY=AIza...

# Option C: OpenAI
OPENAI_API_KEY=sk-proj-...

# Option D: Ollama (Local, free)
# No key needed, just run locally:
# ollama pull llama2
# ollama serve
```

### 5. **JWT Secret**
```
JWT_SECRET=your_random_secret_key_min_32_chars
```

Generate random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Deployment Steps

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup Environment

```bash
cp .env.example .env
# Edit .env with your values from above
nano .env
```

### Step 3: Deploy Smart Contracts

```bash
cd ../smartcontracts

# Deploy to emulator (for local testing)
flow project deploy --network emulator

# Deploy to testnet
flow project deploy --network testnet
```

**After deployment, you'll get contract addresses:**
```
FlowMateAgent: 0xabc123...
VaultManager: 0xdef456...
ScheduledTransactions: 0xghi789...
```

Update `.env` with these addresses:
```
FLOWMATE_AGENT_CONTRACT=0xabc123...
VAULT_MANAGER_CONTRACT=0xdef456...
SCHEDULED_TRANSACTIONS_CONTRACT=0xghi789...
```

### Step 4: Initialize Database

```bash
cd ../backend

# Run migrations
npx prisma migrate deploy

# (Optional) Seed with test data
npx prisma db seed
```

### Step 5: Start Backend

```bash
npm run dev
```

Backend will start on `http://localhost:3000`

Check health:
```bash
curl http://localhost:3000/health
```

## 📁 Folder Structure

```
backend/
├── src/
│   ├── app.ts                 # Main Express app
│   ├── config/
│   │   ├── env.ts             # Environment configuration
│   │   └── flow.ts            # Flow blockchain config
│   ├── middleware/            # (To be created)
│   ├── routes/                # (To be created)
│   ├── controllers/           # (To be created)
│   ├── services/              # (To be created)
│   │   ├── aiService.ts       # Hybrid AI (Claude/Gemini/OpenAI/Ollama)
│   │   ├── authService.ts
│   │   ├── flowService.ts
│   │   └── ruleEngine.ts
│   └── models/                # (To be created)
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── .env.example
├── .env                       # Your config (create from example)
├── package.json
└── tsconfig.json

smartcontracts/
├── contracts/
│   ├── FlowMateAgent.cdc
│   ├── VaultManager.cdc
│   └── ScheduledTransactions.cdc
├── transactions/
│   ├── register_user.cdc
│   └── transfer_between_vaults.cdc
├── scripts/                   # (To be created for queries)
└── flow.json
```

## 🔗 Frontend Integration

Frontend is at: `/Users/ayomisco/Documents/Main/Hackathons/PL Genesis Hacks/FlowMate-01/frontend`

**Update frontend .env:**
```
VITE_API_BASE_URL=http://localhost:3000
VITE_MAGIC_API_KEY=pk_live_...  # Same as backend
```

**Frontend will call backend APIs:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/chat/message` - Chat intent parsing
- `POST /api/v1/rules/create` - Create financial rule
- `GET /api/v1/transactions` - Transaction history
- `GET /api/v1/vaults` - User vaults data

## ✅ Deployment Checklist

- [ ] NeonDB URL provided
- [ ] Flow testnet account set up
- [ ] Magic Link API keys obtained
- [ ] AI provider API key (Claude recommended)
- [ ] `.env` file configured
- [ ] Smart contracts deployed to testnet
- [ ] Contract addresses added to `.env`
- [ ] Database migrations run
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns 200

## 🚨 Common Issues

**"DATABASE_URL is not set"**
→ Make sure `.env` file exists and `DATABASE_URL` is filled

**"Flow account not found"**
→ Check `FLOW_ACCOUNT_ADDRESS` and `FLOW_ACCOUNT_PRIVATE_KEY` are correct

**"Contract not found"**
→ Deploy contracts first, then update addresses in `.env`

**"AI API key invalid"**
→ Make sure API key is correct and has credits/free tier available

## 📚 Next Steps (After Backend Running)

1. Create API routes & controllers
2. Implement authentication (Magic Link + JWT)
3. Create chat intent parser service
4. Build rule engine
5. Connect frontend to backend APIs
6. Deploy to production (Railway/Vercel)

---

**Questions?** Check:
- Flow Docs: https://docs.onflow.org
- Prisma: https://www.prisma.io/docs
- Express: https://expressjs.com
- Magic Link: https://magic.link/docs
