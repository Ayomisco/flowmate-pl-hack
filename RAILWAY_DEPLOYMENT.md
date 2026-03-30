# FlowMate Backend - Railway Deployment Guide

## Overview

This guide covers deploying the FlowMate backend to Railway. The setup includes:
- **Node.js Backend** (Express + TypeScript)
- **PostgreSQL Database** (Neon or Railway PostgreSQL)
- **Redis** (for Bull job queue automation)
- **Docker** (optimized multi-stage build)

## Prerequisites

1. **Railway Account**: https://railway.app
2. **GitHub Account** (for connecting your repo)
3. **Docker** (for local testing)
4. **Node.js 22+** (for local development)

## Architecture

```
Railway Project
├── Backend Service (Docker)
│   ├── Node.js Express API
│   ├── Prisma ORM
│   └── Bull Job Queue
├── PostgreSQL (via Railway PostgreSQL add-on)
├── Redis (via Railway Redis add-on)
└── Environment Variables
```

## Step-by-Step Deployment

### 1. Create Railway Project

```bash
# Via Railway CLI
npm install -g @railway/cli
railway login
railway init

# OR via Web Dashboard
# Visit https://railway.app and create new project
```

### 2. Add Services

**Option A: Using Railway Dashboard (Recommended)**

1. Go to your Railway project
2. Click "+ Add Service" → "Database" → Select "PostgreSQL"
3. Click "+ Add Service" → "Database" → Select "Redis"
4. Click "+ Add Service" → "GitHub Repo" → Select your repo
5. Select branch: `main`

**Option B: Using Railway CLI**

```bash
# PostgreSQL
railway add postgresql

# Redis
railway add redis

# Deploy service (will auto-detect from GitHub)
railway service add frontend --github-repo your-repo
```

### 3. Configure Environment Variables

In Railway Dashboard:

1. Go to your Backend service
2. Click "Variables" tab
3. Add all variables from `.env.example`:

#### Critical Variables (must set):

```env
# Database (auto-filled if using Railway PostgreSQL)
DATABASE_URL=postgresql://...

# Server
PORT=3000
NODE_ENV=production
API_BASE_URL=https://<your-railway-domain>.railway.app

# JWT (generate new secure key)
JWT_SECRET=your-new-32-char-secret-key
JWT_EXPIRY=7d

# Flow Blockchain (use your account)
FLOW_NETWORK=testnet
FLOW_ACCOUNT_ADDRESS=0xc26f3fa2883a46db
FLOW_ACCOUNT_PRIVATE_KEY=d7115bde...

# Smart Contracts
FLOWMATE_AGENT_CONTRACT=0xc26f3fa2883a46db
VAULT_MANAGER_CONTRACT=0xc26f3fa2883a46db
SCHEDULED_TRANSACTIONS_CONTRACT=0xc26f3fa2883a46db

# Magic Link Auth
MAGIC_API_KEY=pk_live_...
MAGIC_SECRET_KEY=sk_live_...

# AI Provider
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.1-70b-versatile

# Redis (auto-filled if using Railway Redis)
REDIS_URL=redis://...

# Frontend
FRONTEND_PRODUCTION_URL=https://your-frontend.vercel.app

# Logging
LOG_LEVEL=info
```

### 4. Database Setup

**If using Railway PostgreSQL:**

Railway automatically creates `DATABASE_URL`, which is used by:
- Prisma (ORM)
- Connection pooling
- Migrations

**If using Neon (external):**

The DATABASE_URL in your `.env` already points to Neon. Update it if needed:
```env
DATABASE_URL=postgresql://neondb_owner:...@ep-summer-wind-amdc7y1t-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 5. Deploy

**Automatic (Recommended):**
- Connect GitHub repo to Railway
- Railway auto-deploys on `main` branch changes
- Uses `Dockerfile` in `/backend` directory

**Manual Deploy:**
```bash
railway deploy
```

### 6. Verify Deployment

```bash
# Check logs
railway logs

# Test health endpoint
curl https://<your-railway-domain>.railway.app/health

# Should return: { status: 'ok', timestamp: '...' }
```

## Environment Variable Setup Checklist

- [ ] DATABASE_URL (PostgreSQL)
- [ ] REDIS_URL (Redis)
- [ ] JWT_SECRET (generate new)
- [ ] FLOW_ACCOUNT_ADDRESS
- [ ] FLOW_ACCOUNT_PRIVATE_KEY
- [ ] FLOWMATE_AGENT_CONTRACT
- [ ] VAULT_MANAGER_CONTRACT
- [ ] SCHEDULED_TRANSACTIONS_CONTRACT
- [ ] MAGIC_API_KEY
- [ ] MAGIC_SECRET_KEY
- [ ] GROQ_API_KEY
- [ ] FRONTEND_PRODUCTION_URL
- [ ] API_BASE_URL

## Troubleshooting

### Service Won't Start

Check logs:
```bash
railway logs
```

Common issues:
- **Database connection failed**: Verify `DATABASE_URL` is correct
- **Port already in use**: Check if something is holding port 3000
- **Migration failed**: Run `railway shell` and test manually

### Health Check Failing

```bash
# SSH into service
railway shell

# Test health endpoint
curl http://localhost:3000/health

# Check logs
npm run dev # if not running
```

### Redis Connection Issues

```bash
# Verify Redis URL
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

## Database Migrations

Migrations run automatically on startup via Docker entrypoint:
```dockerfile
CMD ["sh", "-c", "npm run db:migrate:deploy && node dist/src/server.js"]
```

To manually run migrations:
```bash
railroad shell
npm run db:migrate:deploy
```

## Performance Optimization

### Current Setup
- **Multi-stage Docker build** (reduces image size)
- **Node.js Alpine** (lightweight base image)
- **Non-root user** (security)
- **Health checks** (monitoring)
- **Dumb-init** (proper signal handling)

### Railway Scaling
- Default: 1 replica
- Adjust in `railway.json` if needed:
```json
{
  "deploy": {
    "numReplicas": 2
  }
}
```

## Monitoring

### Available Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | No | Health check |
| `/api/v1` | GET | No | Version info |
| `/api/v1/auth/login` | POST | No | Magic Link auth |
| `/api/v1/transactions/*` | * | JWT | Transaction operations |
| `/api/v1/rules/*` | * | JWT | Automation rules |
| `/api/v1/chat/*` | * | JWT | AI chat |

### Logging

Logs are stored in:
- Railway Dashboard → Logs tab
- Local file: `logs/app.log`

Change log level in `.env`:
```env
LOG_LEVEL=debug  # More verbose
LOG_LEVEL=info   # Standard
LOG_LEVEL=warn   # Warnings only
LOG_LEVEL=error  # Errors only
```

## Production Checklist

- [ ] All environment variables set
- [ ] Database migrations completed
- [ ] Redis connection verified
- [ ] Health endpoint responding
- [ ] Update FRONTEND_PRODUCTION_URL on frontend
- [ ] Test full workflow (login → transaction → rule execution)
- [ ] Monitor logs for errors
- [ ] Set up alerts (optional, via Railway dashboard)

## Rollback Procedure

If deployment fails:

```bash
# View deployment history
railway deployments

# Rollback to previous version
railway rollback <deployment-id>
```

## Next Steps (Frontend)

1. Update frontend `.env`:
```env
VITE_API_URL=https://<your-railway-domain>.railway.app
```

2. Deploy to Vercel:
```bash
cd frontend
vercel --prod
```

## Support

- **Railway Docs**: https://docs.railway.app
- **Error Logs**: Check Railway dashboard → Logs
- **Health Issues**: `/health` endpoint returns diagnostic info

---

**Deployment Date**: [Auto-updated on each deploy]
**Last Updated**: 2026-03-30
