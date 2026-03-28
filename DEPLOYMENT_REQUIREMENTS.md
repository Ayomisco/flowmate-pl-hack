# 📋 FlowMate Deployment Requirements Checklist

This document lists everything you need to provide to deploy FlowMate completely.

---

## 1. 🗄️ Database - NeonDB PostgreSQL

**Status:** ❌ REQUIRED - Not provided yet

**You need to provide:**
```
DATABASE_URL=postgresql://[user]:[password]@[host]/flowmate?sslmode=require
```

**How to get:**
1. Go to https://console.neon.tech
2. Sign up (free)
3. Create project → "flowmate"
4. Copy connection string
5. Add to backend/.env

**Example:**
```
DATABASE_URL=postgresql://neon@neon:password@aws-us-east-1.neon.tech/flowmate?sslmode=require
```

---

## 2. 🔗 Flow Blockchain - Testnet Account

**Status:** ❌ REQUIRED - Not provided yet

**You need to provide:**
```
FLOW_ACCOUNT_ADDRESS=0x...
FLOW_ACCOUNT_PRIVATE_KEY=...
```

**How to get:**
```bash
# 1. Install Flow CLI
brew install flow-cli

# 2. Generate keys
flow keys generate

# 3. You'll see output like:
# 🔐 Generating keys...
# Private Key (hex): 8ae3d0461cfed6d6859cebf3573265c0e21f04f77fbed32218b82b0c917f7488
# Public Key (hex): 00e8c3f5...

# 4. Take the PUBLIC KEY and request testnet FLOW:
# https://testnet-faucet.onflow.org
# (Paste your public key, you get free FLOW)

# 5. Then use the PRIVATE KEY in your .env
```

**Example:**
```
FLOW_ACCOUNT_ADDRESS=0xf8d6e0586b0a20c7
FLOW_ACCOUNT_PRIVATE_KEY=8ae3d0461cfed6d6859cebf3573265c0e21f04f77fbed32218b82b0c917f7488
```

---

## 3. 🪄 Magic Link - Authentication

**Status:** ❌ REQUIRED - Not provided yet

**You need to provide:**
```
MAGIC_API_KEY=pk_live_...
MAGIC_SECRET_KEY=...
```

**How to get:**
1. Go to https://magic.link
2. Sign up (free)
3. Create new project
4. Select blockchain: **Flow**
5. Go to Dashboard → API Keys
6. Copy "Publishable API Key" → `MAGIC_API_KEY`
7. Copy "Secret Key" → `MAGIC_SECRET_KEY`

**Example:**
```
MAGIC_API_KEY=pk_live_685671DCC4E8ABC2
MAGIC_SECRET_KEY=sk_live_abc123xyz789...
```

---

## 4. 🤖 AI Provider - Choose ONE

**Status:** ❌ REQUIRED - Not provided yet

### Option A: Claude (Recommended ⭐)

**Get API Key:**
1. Go to https://console.anthropic.com
2. Sign up (free $5 credits)
3. Create API key
4. Copy to `.env`

```
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-...
```

### Option B: Gemini (Free tier limited)

```
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
```

### Option C: OpenAI

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
```

### Option D: Ollama (Local, free)

```
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

Install locally:
```bash
brew install ollama
ollama pull llama2
ollama serve
```

---

## 5. 🔑 JWT Secret

**Status:** ❌ REQUIRED - Generate a random one

Generate random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```
JWT_SECRET=your_generated_secret_here
```

---

## 6. 🌐 Frontend URLs (After deployment)

**Status:** ✅ OPTIONAL (can be defaults)

```
FRONTEND_URL=http://localhost:5173              # Dev
FRONTEND_PRODUCTION_URL=https://yourdomain.com  # Production
```

---

## 📝 Complete `.env` Template

Copy this and fill in your values:

```bash
# ==================== SERVER ====================
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000

# ==================== DATABASE ====================
# From NeonDB
DATABASE_URL=postgresql://[YOUR_NEON_URL]

# ==================== JWT AUTHENTICATION ====================
JWT_SECRET=[YOUR_RANDOM_SECRET]
JWT_EXPIRY=7d

# ==================== FLOW BLOCKCHAIN ====================
FLOW_NETWORK=testnet
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_ACCOUNT_ADDRESS=[YOUR_FLOW_ADDRESS]
FLOW_ACCOUNT_PRIVATE_KEY=[YOUR_FLOW_PRIVATE_KEY]

# ==================== MAGIC LINK AUTH ====================
MAGIC_API_KEY=[YOUR_MAGIC_API_KEY]
MAGIC_SECRET_KEY=[YOUR_MAGIC_SECRET_KEY]

# ==================== AI CONFIGURATION ====================
AI_PROVIDER=claude
CLAUDE_API_KEY=[YOUR_CLAUDE_API_KEY]
CLAUDE_MODEL=claude-3-sonnet-20240229

# (Optional - only if using different AI)
# GEMINI_API_KEY=...
# OPENAI_API_KEY=...
# OLLAMA_URL=...

# ==================== LOGGING ====================
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# ==================== REDIS (Job Queue) ====================
REDIS_URL=redis://localhost:6379

# ==================== FRONTEND ====================
FRONTEND_URL=http://localhost:5173
FRONTEND_PRODUCTION_URL=https://flowmate.app
```

---

## 📊 After Smart Contract Deployment

When you deploy contracts to Flow testnet, you'll get addresses like:

```
Account: 0xf8d6e0586b0a20c7

Contracts:
  FlowMateAgent: 0xf8d6e0586b0a20c7.FlowMateAgent
  VaultManager: 0xf8d6e0586b0a20c7.VaultManager
  ScheduledTransactions: 0xf8d6e0586b0a20c7.ScheduledTransactions
```

Add these to `.env`:

```
FLOWMATE_AGENT_CONTRACT=0xf8d6e0586b0a20c7
VAULT_MANAGER_CONTRACT=0xf8d6e0586b0a20c7
SCHEDULED_TRANSACTIONS_CONTRACT=0xf8d6e0586b0a20c7
```

---

## ✅ Deployment Checklist

- [ ] **NeonDB**: PostgreSQL `DATABASE_URL` provided
- [ ] **Flow Testnet**: Account address & private key provided
- [ ] **Magic Link**: API key & secret key provided
- [ ] **AI Provider**: Claude API key (or alternative) provided
- [ ] **JWT Secret**: Random secret generated
- [ ] **Smart Contracts**: Deployed to testnet, addresses obtained
- [ ] **`.env` file**: Created in backend/ with all values
- [ ] **Dependencies**: `npm install` in backend/
- [ ] **Database**: `npx prisma migrate deploy`
- [ ] **Backend start**: `npm run dev` works without errors

---

## 🎯 Priority Order

1. **🔴 CRITICAL** - Get NeonDB URL
2. **🔴 CRITICAL** - Get Flow testnet account
3. **🔴 CRITICAL** - Get Magic Link keys
4. **🔴 CRITICAL** - Get AI provider key
5. **🟡 IMPORTANT** - Deploy smart contracts
6. **🟡 IMPORTANT** - Configure `.env`
7. **🟢 READY** - Start backend
8. 🟢 READY** - Integrate with frontend

---

## 💬 Quick Reference

**Get NeonDB URL straight away?**
→ Use this to create free database

**Flow account problems?**
→ Use Flow CLI: `flow keys generate`

**AI API key lost?**
→ Can regenerate from provider dashboard

**Not sure about contract addresses?**
→ They're shown after `flow project deploy --network testnet`

---

## 🚢 Deployment Commands (Once Everything Ready)

```bash
# 1. Install
cd backend && npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Install Prisma
npm install -D prisma @prisma/client

# 4. Run migrations
npx prisma migrate deploy

# 5. Start backend
npm run dev

# Backend will run on http://localhost:3000
```

---

**Status Summary:**
- ✅ Smart contracts: READY (in `/smartcontracts`)
- ✅ Backend scaffold: READY (in `/backend`)
- ✅ Database schema: READY (Prisma)
- ❌ Database credentials: WAITING FOR YOU
- ❌ Flow account: WAITING FOR YOU
- ❌ Magic Link keys: WAITING FOR YOU
- ❌ AI provider key: WAITING FOR YOU

**You're 50% there!** 🎉
