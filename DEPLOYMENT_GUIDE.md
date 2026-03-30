# FlowMate - Full Deployment Guide

## Quick Summary: Why Railway + Vercel?

| Component | Platform | Why |
|-----------|----------|-----|
| **Backend** | **Railway** | Supports Bull job queue for automations (Vercel serverless would kill long-running jobs) |
| **Frontend** | **Vercel** | Optimized for React/Vite, excellent CDN, simple deployment |
| **Database** | Railway PostgreSQL OR Neon | Persistent storage |
| **Cache/Queue** | Railway Redis | Needed for automation scheduling |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Users                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTPS (SSL)
                         │
        ┌────────────────┴────────────────┐
        │                                  │
    ┌───▼──────────────┐         ┌────────▼────────────┐
    │  Vercel CDN      │         │  CloudFlare (optional)
    │  (Frontend)      │         │  (DDoS Protection)
    │  vercel.app      │         │
    └───┬──────────────┘         └────────┬────────────┘
        │                                  │
        │                          HTTPS (SSL)
        │                                  │
        │         ┌────────────────────────┘
        │         │
        │    ┌────▼────────────────┐
        │    │  Railway Backend    │
        │    │  (Node.js + Docker) │
        │    │  railway.app        │
        │    └────┬────────┬──────┘
        │         │        │
        │    ┌────┴────┐   │
        │    │          │   │
        │    │ Prisma  │  │ Bull
        │    │  ORM    │  │ Queue
        │    │         │   │
        │ ┌──▼───────────┬─▼──────────┐
        │ │              │             │
        │ │          ┌───▼───────┐    │
        └─┤          │PostgreSQL │◄───┤
          │          │(Railway)  │    │
          │          └────┬──────┘    │
          │               │           │
          │          ┌────▼──────┐    │
          │          │   Redis   │◄───┘
          │          │ (Railway) │
          │          └───────────┘
          │
          └─ All encrypted & secured
```

---

## Part 1: Backend Deployment (Railway)

### Prerequisites

- Railway account: https://railway.app
- GitHub repo with code pushed

### Step 1: Create Railway Project

```bash
# Via CLI
npm install -g @railway/cli
railway login

# Create project
railway init

# Follow prompts to connect GitHub repo
```

### Step 2: Add Services

From Railway Dashboard:

1. **Backend Service**
   - Add service → GitHub repo
   - Select `main` branch
   - Railway auto-detects Dockerfile

2. **PostgreSQL**
   - Add service → Database → PostgreSQL
   - Railway auto-creates `DATABASE_URL`

3. **Redis**
   - Add service → Database → Redis
   - Railway auto-creates `REDIS_URL`

### Step 3: Configure Environment Variables

Set these in Railway Dashboard → Backend service → Variables:

```env
# ========== CRITICAL ==========
NODE_ENV=production
PORT=3000
DATABASE_URL=<auto-filled by Railway PostgreSQL>
REDIS_URL=<auto-filled by Railway Redis>
API_BASE_URL=https://<your-railway-domain>.railway.app
JWT_SECRET=<generate new: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# ========== BLOCKCHAIN ==========
FLOW_NETWORK=testnet
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_ACCOUNT_ADDRESS=0xc26f3fa2883a46db
FLOW_ACCOUNT_PRIVATE_KEY=d7115bde...

FLOWMATE_AGENT_CONTRACT=0xc26f3fa2883a46db
VAULT_MANAGER_CONTRACT=0xc26f3fa2883a46db
SCHEDULED_TRANSACTIONS_CONTRACT=0xc26f3fa2883a46db

# ========== AUTHENTICATION ==========
MAGIC_API_KEY=pk_live_685671DCC4E8ABC2
MAGIC_SECRET_KEY=sk_live_B2FE5D52EA137792

# ========== AI ==========
AI_PROVIDER=groq
GROQ_API_KEY=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
GROQ_MODEL=llama-3.1-70b-versatile

# ========== FRONTEND ==========
FRONTEND_PRODUCTION_URL=https://your-frontend.vercel.app
LOG_LEVEL=info
```

### Step 4: Deploy

Railway auto-deploys on push to `main` branch.

**Manual deploy:**
```bash
railway deploy
```

**Check status:**
```bash
# Logs
railway logs

# Status
railway status
```

### Step 5: Verify Backend

Get your backend URL from Railway Dashboard → Backend → Domains

```bash
# Test health
curl https://<your-railway-domain>.railway.app/health

# Should return:
# {"status": "ok", "timestamp": "2026-03-30T..."}
```

✅ **Backend is live!** Save this URL for the frontend config.

---

## Part 2: Frontend Deployment (Vercel)

### Prerequisites

- Vercel account: https://vercel.com
- GitHub repo with code pushed
- Backend URL from Railway (from Part 1, Step 5)

### Step 1: Import Project to Vercel

Visit https://vercel.com → New Project

1. Import your GitHub repo
2. Select `frontend` directory
3. Click "Deploy"

### Step 2: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
# Production
VITE_API_URL=https://<your-railway-domain>.railway.app
VITE_MAGIC_PUBLISHABLE_KEY=pk_live_685671DCC4E8ABC2
```

### Step 3: Redeploy with New Env Vars

After adding environment variables:

Vercel Dashboard → Deployments → Redeploy latest

Or via CLI:
```bash
vercel --prod
```

### Step 4: Verify Frontend

Visit `https://your-frontend.vercel.app`

Test the full flow:
1. ✅ Login with Magic Link
2. ✅ See dashboard with vaults
3. ✅ Try "Save 10 FLOW"
4. ✅ See transaction with explorer link
5. ✅ Try chat: "Save 50 FLOW to savings"
6. ✅ See AI response and execution

---

## Part 3: Verify Full Integration

### Test Checklist

- [ ] **Backend Health**
  ```bash
  curl https://<your-railway-domain>.railway.app/health
  ```

- [ ] **Frontend Loads**
  - Visit https://your-frontend.vercel.app
  - Should load without errors

- [ ] **Login Works**
  - Click "Connect Wallet"
  - Send yourself Magic Link email
  - Link in email should work
  - Dashboard should load

- [ ] **Save Transaction**
  - Amount: 10 FLOW
  - To Vault: savings
  - Watch balance deduct
  - See transaction hash

- [ ] **AI Chat**
  - Message: "What's my balance?"
  - Should respond with actual balances
  - Message: "Save 50 FLOW"
  - Should execute if autopilot enabled

- [ ] **Automation Rule**
  - Create rule: "Save 5 FLOW weekly"
  - Check at scheduled time
  - Should execute and record transaction

---

## Troubleshooting

### Backend Won't Start

```bash
# SSH into Railway
railway shell

# Check logs
npm run dev

# Test DB connection
prisma db push

# Check Redis
redis-cli -u $REDIS_URL ping
```

### Frontend Shows "Cannot reach API"

1. Check `VITE_API_URL` in Vercel Dashboard
2. Verify Railway backend is running
3. Check CORS headers in backend

```bash
# Test from frontend console
fetch('https://your-railway-domain.railway.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Transactions Show "Invalid txHash"

- Backend not submitting real Flow transactions
- Check `FLOW_ACCOUNT_PRIVATE_KEY` is set
- Check Flow testnet is accessible
- Check contract addresses are correct

---

## Environment Variables Summary

### Backend (.env on Railway)

| Variable | Example | Where |
|----------|---------|-------|
| `NODE_ENV` | `production` | Manual |
| `DATABASE_URL` | `postgresql://...` | Auto Railway PostgreSQL |
| `REDIS_URL` | `redis://...` | Auto Railway Redis |
| `FLOW_ACCOUNT_ADDRESS` | `0xc26f3fa2883a46db` | Manual (your account) |
| `FLOW_ACCOUNT_PRIVATE_KEY` | `d7115bde...` | Manual (your key) |
| `GROQ_API_KEY` | `gsk_...` | Manual (your API key) |
| `JWT_SECRET` | Generated | Manual (generate new) |
| `MAGIC_API_KEY` | From Magic dashboard | Manual |
| `FRONTEND_PRODUCTION_URL` | Vercel domain | Update with frontend URL |

### Frontend (.env on Vercel)

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://your-railway-domain.railway.app` |
| `VITE_MAGIC_PUBLISHABLE_KEY` | `pk_live_...` |

---

## Deployment Summary

```
Local Development
  ├── Frontend: http://localhost:8080
  ├── Backend: http://localhost:3000
  └── Database: Neon (remote)

↓ Push to GitHub

Production
  ├── Frontend: Vercel (https://your-frontend.vercel.app)
  ├── Backend: Railway (https://your-backend.railway.app)
  ├── Database: Railway PostgreSQL
  └── Cache: Railway Redis
```

---

## Next Steps (if issues)

1. **Check Railway logs**: `railway logs`
2. **Check Vercel logs**: Vercel Dashboard → Deployments
3. **Health check**: `curl <backend>/health`
4. **Test API**: Frontend console → fetch('<backend>/health')
5. **Check env vars**: `echo $VARIABLE_NAME` (in Railway shell)

---

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Store keys in Railway/Vercel dashboards only
- [ ] Use `JWT_SECRET` - generate new for production
- [ ] Verify `FRONTEND_PRODUCTION_URL` is HTTPS
- [ ] Check CORS settings in backend
- [ ] Verify API rate limiting is enabled
- [ ] Monitor transaction logs for anomalies

---

## Performance Optimization

**Frontend (Vercel):**
- CDN distribution across 300+ edge locations
- Automatic image optimization
- Code splitting via Vite
- Caching headers configured

**Backend (Railway):**
- Container auto-scaling
- Load balancing
- Connection pooling (Neon)
- Redis caching for frequent queries

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Flow Docs**: https://developers.flow.com
- **Deployment Status**: Dashboard → Logs tab

---

**Status**: Production Ready ✅
**Last Updated**: 2026-03-30
