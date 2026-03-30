# Docker & Railway Deployment Files

This directory contains production-ready configurations for deploying FlowMate.

## Files Overview

### Backend Docker Setup

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Multi-stage production Docker build |
| `backend/.dockerignore` | Exclude unnecessary files from Docker image |
| `backend/railway.json` | Railway deployment configuration |
| `backend/.env.example` | Environment variables template (production) |

**Key Features:**
- ✅ Multi-stage build (optimizes image size)
- ✅ Non-root user (security)
- ✅ Health checks (monitoring)
- ✅ Dumb-init (proper signal handling)
- ✅ Auto migrations on startup
- ✅ Production ready for Railway

### Frontend Vercel Setup

| File | Purpose |
|------|---------|
| `frontend/.env.example` | Environment variables template |
| `frontend/vercel.json` | Vercel deployment configuration |

**Key Features:**
- ✅ Auto-build from GitHub
- ✅ Environment variable injection
- ✅ SPA routing configuration
- ✅ Cache headers optimization
- ✅ Production ready for Vercel

### Root Configuration

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local testing (PostgreSQL + Redis + Backend) |
| `DEPLOYMENT_GUIDE.md` | Complete step-by-step deployment guide |
| `RAILWAY_DEPLOYMENT.md` | Backend-specific Railway instructions |
| `VERCEL_DEPLOYMENT.md` | Frontend-specific Vercel instructions |

---

## Quick Start: Cloud Deployment

### 1️⃣ Deploy Backend to Railway (5 minutes)

```bash
# Step 1: Create Railway project
npm install -g @railway/cli
railway login
railway init

# Step 2: Railway auto-detects Dockerfile
# Go to Dashboard and add PostgreSQL + Redis services

# Step 3: Set environment variables in Dashboard
# Use backend/.env.example as reference

# Step 4: Deploy
git push main  # Auto-deploys via GitHub integration

# Step 5: Get your backend URL
# Railway Dashboard → Backend → Domains → Copy URL
```

**Save this URL** - you'll need it for frontend config.

### 2️⃣ Deploy Frontend to Vercel (5 minutes)

```bash
# Step 1: Add backend URL to Vercel Dashboard
# Settings → Environment Variables:
# VITE_API_URL = https://your-railway-domain.railway.app

# Step 2: Deploy
# Via Dashboard: Import GitHub repo, select frontend/ directory
# OR Via CLI:
npm install -g vercel
cd frontend
vercel --prod

# Step 3: Test
# Visit https://your-frontend.vercel.app
# Login, save transaction, check transaction hash
```

---

## Local Testing with Docker Compose

### Requirements

- Docker & Docker Compose installed
- `.env` file with Flow credentials

### Run Locally

```bash
# Copy environment variables
cp backend/.env.example .env.local

# Edit .env.local with YOUR values:
# - FLOW_ACCOUNT_ADDRESS
# - FLOW_ACCOUNT_PRIVATE_KEY
# - GROQ_API_KEY
# - MAGIC_API_KEY, MAGIC_SECRET_KEY

# Load env vars and start services
# macOS/Linux:
export $(cat .env.local | xargs)
docker-compose up --build

# Windows (PowerShell):
Get-Content .env.local | ForEach-Object { $item = $_.Split('='); [Environment]::SetEnvironmentVariable($item[0], $item[1]) }
docker-compose up --build
```

### Services Running

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Backend**: `http://localhost:3000`

### Test Locally

```bash
# Health check
curl http://localhost:3000/health

# Stop all services
docker-compose down

# Cleanup volumes
docker-compose down -v
```

---

## File Details

### backend/Dockerfile

**Multi-stage build process:**

1. **Builder Stage**
   - Installs dependencies
   - Compiles TypeScript
   - Optimized for size

2. **Production Stage**
   - Only copies compiled code
   - Non-root user (nodejs)
   - Minimal dependencies
   - ~500MB final image

**Startup command:**
```
npm run db:migrate:deploy && node dist/src/server.js
```

Migrations run automatically on every container start.

### backend/railway.json

Railway-specific configuration:
- Dockerfile detection
- Startup command
- Restart policy
- Replica count (1)

### docker-compose.yml

Local testing setup with:
- PostgreSQL (Railway equivalent)
- Redis (Railway equivalent)
- Backend service
- Health checks
- Named networks

Used for:
- Local development testing
- Docker image validation
- Verifying migrations
- Testing Bull job queue

---

## Environment Variables Checklist

### Critical (Must set)

- [ ] `FLOW_ACCOUNT_ADDRESS`
- [ ] `FLOW_ACCOUNT_PRIVATE_KEY`
- [ ] `JWT_SECRET` (generate new)
- [ ] `DATABASE_URL` (auto-set by Railway)
- [ ] `REDIS_URL` (auto-set by Railway)

### Authentication

- [ ] `MAGIC_API_KEY`
- [ ] `MAGIC_SECRET_KEY`

### AI

- [ ] `GROQ_API_KEY`
- [ ] `GROQ_MODEL` (preset: llama-3.1-70b-versatile)

### Smart Contracts

- [ ] `FLOWMATE_AGENT_CONTRACT`
- [ ] `VAULT_MANAGER_CONTRACT`
- [ ] `SCHEDULED_TRANSACTIONS_CONTRACT`

### Optional

- [ ] `LOG_LEVEL` (default: info)
- [ ] `FRONTEND_PRODUCTION_URL` (needed for frontend)

---

## Deployment Architecture

```
GitHub
  ↓ (push to main)
  ├─→ Railway (auto-deploy backend)
  │   ├─ Dockerfile build
  │   ├─ PostgreSQL (auto)
  │   ├─ Redis (auto)
  │   └─ Environment variables (manual)
  │
  └─→ Vercel (auto-deploy frontend)
      ├─ npm run build
      ├─ Environment variables (manual)
      └─ Global CDN distribution
```

---

## Troubleshooting

### "Database connection failed"

```bash
# Check DATABASE_URL in Railway service
railway shell
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# If Neon (external), verify sslmode=require
# If Railway PostgreSQL, No sslmode needed
```

### "Redis connection failed"

```bash
# Check REDIS_URL
railway shell
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

### "Migrations not running"

```bash
# If docker-compose:
docker-compose logs backend

# If Railway:
railway logs

# Manually run migrations:
railway shell
npm run db:migrate:deploy
```

### "Frontend API connection failed"

```bash
# Verify VITE_API_URL in Vercel Dashboard
# Should be: https://your-railway-domain.railway.app

# Test from browser console:
fetch('https://your-railway-domain.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

---

## Verification Checklist

- [ ] Backend builds locally: `docker-compose up --build`
- [ ] Backend health OK: `curl http://localhost:3000/health`
- [ ] Database migrations run automatically
- [ ] Redis job queue connects
- [ ] Frontend env vars updated
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Production URLs accessible
- [ ] Login with Magic Link works
- [ ] Save transaction executes
- [ ] Transaction appears in history
- [ ] AI chat responds
- [ ] Automation rules schedule

---

## Security Notes

1. **Never commit secrets**
   - Use `.env` locally only
   - Set via Railway/Vercel dashboards

2. **JWT_SECRET**
   - Generate new for production:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   - Never reuse from development

3. **Flow Private Key**
   - Only store in secure environment variables
   - Rotable via Flow account settings

4. **Docker Registry**
   - Railway doesn't push to public registries
   - Private build only accessible to Railway

---

## Performance Notes

**Image Size:**
- Builder stage: ~1.5GB (not included)
- Final image: ~500MB

**Build Time:**
- Initial: ~3-5 minutes
- Cached builds: ~30-60 seconds

**Startup Time:**
- Container start: ~10-15 seconds
- Full ready (migrations): ~20-30 seconds

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Docker Docs**: https://docs.docker.com
- **Prisma**: https://www.prisma.io/docs

---

## Next Steps

1. ✅ Read `DEPLOYMENT_GUIDE.md` for full walkthrough
2. ✅ Deploy backend to Railway
3. ✅ Configure frontend env vars
4. ✅ Deploy frontend to Vercel
5. ✅ Test production URLs
6. ✅ Monitor logs for issues

---

**Setup Version**: 1.0
**Last Updated**: 2026-03-30
**Status**: Production Ready ✅
