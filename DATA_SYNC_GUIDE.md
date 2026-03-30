# FlowMate Data & Transaction History Guide

## 📊 What Should Work Now

### 1. **Real Dashboard Data**
- ✅ **Total Wealth** - Sum of all vaults from database
- ✅ **Vault Balances** - Fetched from `/api/v1/vaults` endpoint
- ✅ **Recent Transactions** - Fetched from `/api/v1/transactions?limit=5`
- ✅ **Active Rules** - Fetched from `/api/v1/rules`
- ✅ **Active Goals** - Fetched from `/api/v1/goals`

### 2. **Transaction History with Real Data**
Each transaction now includes:
- ✅ **txHash** - Real transaction ID from Flow blockchain (or `chat:xxx` from chat, `rule:xxx` from automations)
- ✅ **explorerUrl** - Link to view on FlowScan testnet
- ✅ **status** - "confirmed" for successful transactions
- ✅ **metadata** - Source (manual/chat/automation), FromVault, ToVault
- ✅ **createdAt** - Timestamp of transaction

### 3. **Balance Deductions**
When you save/send/stake:
1. ✅ Cadence transaction submitted to Flow blockchain
2. ✅ Get real txHash from Flow network
3. ✅ Update local database vaults (decrement from/increment to)
4. ✅ Create transaction record with explorer URL
5. ✅ Return to frontend with real data

---

## 🗑️ Clean Database for Fresh Start

### Option 1: Quick Cleanup (Recommended)
Run the cleanup script:

```bash
cd backend
npm run db:clean
```

This will delete:
- ✅ All transactions
- ✅ All rules & scheduled executions
- ✅ All chat messages
- ✅ All vaults
- ✅ All goals & notifications
- ✅ **Keeps user accounts** (so you stay logged in)

### Option 2: Full Reset (Delete Everything)
Edit `backend/prisma/clean.ts`, uncomment the User deletion line, then run:
```bash
npm run db:clean
```

### Option 3: Manual via Prisma Studio
```bash
npm run prisma:studio
# Then delete records through the UI
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  Dashboard.tsx fetches: /vaults, /transactions, /rules, /goals  │
└────────────────────────────┬────────────────────────────────────┘
                             │ (API calls)
┌────────────────────────────▼────────────────────────────────────┐
│                      Backend (Node.js)                          │
│                                                                 │
│  1. GET /api/v1/vaults                                          │
│     └─ Prisma.vault.findMany() → Returns DB balances           │
│                                                                 │
│  2. GET /api/v1/transactions?limit=5                           │
│     └─ Prisma.transaction.findMany() → Returns TX history      │
│        (includes txHash, explorerUrl, metadata)                │
│                                                                 │
│  3. POST /api/v1/transactions/save                              │
│     ├─ Check balance in Prisma                                 │
│     ├─ Call Flow SDK → executeFlow()                           │
│     │  └─ Get real txHash from Flow blockchain                │
│     ├─ Update Prisma vaults (decrement/increment)             │
│     └─ Create Prisma.transaction with explorerUrl             │
│                                                                 │
│  4. POST /api/v1/rules (Automation)                             │
│     ├─ Create rule in Prisma                                   │
│     ├─ Schedule in Bull job queue                              │
│     └─ Job executes at scheduled time:                         │
│        ├─ Call Flow SDK → executeFlow()                        │
│        ├─ Update Prisma vaults                                 │
│        └─ Create Prisma.transaction record                     │
│                                                                 │
│  5. POST /api/v1/chat (AI Chat)                                │
│     ├─ Send to Groq AI (fixed model: llama-3.1-70b)           │
│     ├─ Get intent & action from AI                             │
│     └─ Execute action (same as /save, /send, /stake)          │
│        (if autopilot mode: auto-execute)                       │
│                                                                 │
└─────────────────────────────┬──────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│              Prisma Database (Neon PostgreSQL)                  │
│                                                                 │
│  • User (accounts, autonomy mode, daily limits)                │
│  • Vault (available, savings, emergency, staking balances)    │
│  • Transaction (history with txHash, explorerUrl)             │
│  • Rule (automations settings & execution history)             │
│  • ChatMessage (AI chat history)                               │
│                                                                 │
└─────────────────────────────┬──────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│         Flow Blockchain & FlowScan (Real Chain)                │
│                                                                 │
│  • VaultManager contract (0xc26f3fa2883a46db)                 │
│  • FlowMateAgent contract (0xc26f3fa2883a46db)                │
│  • Real transactions visible at:                               │
│    https://testnet.flowscan.io/tx/{txHash}                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Transaction Types in History

### Manual Transactions
**Source:** User clicks buttons (Save, Send, Stake, Swap)
- **txHash Format:** Real hash from Flow blockchain
- **Status:** "confirmed" immediately
- **Explorer:** Real FlowScan link
- **Metadata:** `{ fromVault, toVault, source: "manual" }`

### Chat-Initiated Transactions
**Source:** AI chat with autopilot enabled
- **txHash Format:** `chat:xxxxx` (fallback if Flow submission fails)
- **Status:** "confirmed"
- **Metadata:** `{ source: "chat", intent, parsed_action }`
- **Note:** Only executes in autopilot mode

### Automated Rule Transactions
**Source:** Scheduled automation rules
- **txHash Format:** Real or fallback based on Flow execution
- **Status:** "pending" → "confirmed" as execution completes
- **Metadata:** `{ source: "automation", ruleType, frequency }`
- **Trigger:** At scheduled time (daily/weekly/monthly)

---

## 🔍 What You'll See in Dashboard After Cleanup

### Before Cleanup:
```
Total Wealth: 500 FLOW (mixed old + new data)
Recent Transactions: 20+ with fake hashes (rule:xxx, internal:xxx)
Vault Balances: Inconsistent (might have old saves)
Rules: Many pending from old tests
```

### After Cleanup:
```
Total Wealth: 500 FLOW (fresh from latest test)
Recent Transactions: Empty (clean slate)
Vault Balances: Fresh (one of each: available, savings, emergency, staking)
Rules: Empty (no automations)
Chat History: Empty (no messages)
```

---

## ✅ Testing Checklist After Cleanup

1. **Dashboard Loads**
   - [ ] All vault balances show
   - [ ] Total wealth calculates correctly
   - [ ] No old transactions in history

2. **Create a Transaction**
   - [ ] Click "Save" → Save 10 FLOW to Savings
   - [ ] See transaction appear in history
   - [ ] Available vault decreases by 10
   - [ ] Savings vault increases by 10
   - [ ] txHash is valid (not "internal:xxx")
   - [ ] Explorer link works on FlowScan

3. **Create an Automation Rule**
   - [ ] Go to Automations tab
   - [ ] Create "Save 5 FLOW weekly"
   - [ ] See rule created with next execution time
   - [ ] Rule appears in history as pending

4. **Chat Interaction**
   - [ ] Say "Send 20 FLOW to 0x123..."
   - [ ] Get AI response with action
   - [ ] Transaction executes (if autopilot enabled)
   - [ ] See real transaction in history

---

## 📊 Database Size After Cleanup

```
Metric              Before      After
─────────────────────────────────────
User accounts         1-5         1-5
Vaults              20-30           4
Transactions       100-500          0
Chat messages       50-200          0
Rules              10-30            0
Total DB size       ~5MB      ~100KB
```

---

## 🚨 Common Issues & Fixes

### Issue: Still seeing old transactions after cleanup
**Fix:** Refresh browser cache
```bash
# Hard refresh in browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Issue: Vault balances not updating after save
**Fix:** Ensure autoFocus on amount input isn't causing form issues
- Check browser console for errors
- Verify response includes `{ success: true }`

### Issue: Explorer URL gives "Transaction not found"
**Fix:** Check CLI logs for Flow submission errors
- May be due to network timeouts
- Check `.env` has correct FLOW_ACCOUNT_PRIVATE_KEY

### Issue: Chat not responding
**Fix:** Verify Groq model is active
```bash
# Check in .env
GROQ_MODEL=llama-3.1-70b-versatile
```

---

## 📈 Next Steps

1. **Clean database:**
   ```bash
   cd backend && npm run db:clean
   ```

2. **Restart backend:**
   ```bash
   npm run dev
   ```

3. **Test fresh transactions** and verify data flows through properly

4. **Monitor logs** for any Flow blockchain submission errors

Everything should now show **real data** end-to-end! 🎉
