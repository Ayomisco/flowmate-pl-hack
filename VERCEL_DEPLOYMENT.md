# FlowMate Frontend - Vercel Deployment Guide

## Overview

This guide covers deploying the FlowMate frontend (React + Vite) to Vercel.

## Prerequisites

1. **Vercel Account**: https://vercel.com
2. **GitHub Account** (for connecting your repo)
3. **Node.js 22+**

## Quick Start

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Select `frontend` as root directory
5. Add environment variables (see below)
6. Click "Deploy"

### Option 2: Via Vercel CLI

```bash
# Install CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel --prod

# When prompted:
# - Link to existing project? No (first time)
# - Set project name? flowmate-frontend
# - Vercel scope? Select your account
```

## Environment Variables

### In Vercel Dashboard

1. Go to Project Settings → Environment Variables
2. Add these variables:

```env
# Production only
VITE_API_URL=https://your-railway-backend.railway.app
VITE_MAGIC_API_KEY=pk_live_685671DCC4E8ABC2

# Optional: for development
VITE_LOG_LEVEL=info
```

### Local Development (.env.local)

Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:3000
VITE_MAGIC_API_KEY=pk_live_685671DCC4E8ABC2
VITE_LOG_LEVEL=debug
```

## Build Configuration

Vercel auto-detects:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

To customize, create `vercel.json` in frontend root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@vite_api_url"
  }
}
```

## Deployment Verification

1. **Check Build Logs**
   - Vercel Dashboard → Deployments → Click latest

2. **Test Endpoints**
   ```bash
   # Frontend is live
   https://your-frontend.vercel.app

   # Test API connection
   curl https://your-railway-backend.railway.app/health
   ```

3. **Full Workflow Test**
   - Visit https://your-frontend.vercel.app
   - Login with Magic Link
   - Try Save operation
   - Check transaction in history

## Preview Deployments

Vercel auto-creates preview deployments on pull requests:
- Main branch → Production (`https://your-frontend.vercel.app`)
- Feature branches → Preview (`https://branch-name.your-frontend.vercel.app`)

## Production Optimization

The Vite build is already optimized:
- Code splitting
- Tree shaking
- Minification
- Asset compression

Vercel adds:
- Global CDN
- Automatic caching
- Edge compression
- Image optimization

## Environment Variable Updates

After deploying backend to Railway:

1. Get your Railway backend URL from:
   - Railway Dashboard → Backend service → "Domains" tab
   - Copy the domain (e.g., `https://flowmate-prod.railway.app`)

2. Update Vercel environment:
   ```bash
   # Via CLI
   vercel env add VITE_API_URL https://your-railway-backend.railway.app

   # OR via dashboard → Settings → Environment Variables
   ```

3. Redeploy:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Build Fails

Check logs in Vercel Dashboard:
```bash
# Common issues:
# - Missing dependencies: npm install
# - Env vars not found: Check Settings → Environment Variables
# - Type errors: npm run build locally to debug
```

### API Connection Issues

Test connectivity:
```bash
# From browser console
fetch('https://your-railway-backend.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

### Static Files Not Loading

Check `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/',  // Ensure correct base path
  build: {
    outDir: 'dist'
  }
})
```

### Environment Variables Not Updated

```bash
# Redeploy to pick up latest env changes
vercel --prod

# Or via dashboard → Deployments → Redeploy
```

## Best Practices

1. **Always update `VITE_API_URL`** after deploying backend
2. **Test in preview first** before production deploy
3. **Keep sensitive keys in Vercel dashboard**, not in repo
4. **Monitor build logs** for warnings
5. **Use GitHub branch protection** before merging

## Integration Checklist

- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` points to Railway backend
- [ ] Environment variables set in Vercel
- [ ] Production domain accessible
- [ ] Health check returns 200
- [ ] Login with Magic Link works
- [ ] Save transaction executes
- [ ] Transaction appears in history
- [ ] Explorer link works on FlowScan
- [ ] Chat responds with AI suggestions

## Performance Monitoring

Via Vercel Analytics (optional, upgrade required):
- Page load times
- Core Web Vitals
- Error tracking
- User analytics

## Rollback

If deployment has issues:

```bash
# View all deployments
vercel deployments

# Rollback to previous
vercel rollback <deployment-id>
```

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Update `VITE_API_URL` in Vercel
3. ✅ Deploy frontend to Vercel
4. ✅ Test full workflow
5. ✅ Monitor logs and performance

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Build Logs**: Vercel Dashboard → Deployments
- **Environment Setup**: Vercel Dashboard → Settings

---

**Deployment Date**: [Auto-updated]
**Last Updated**: 2026-03-30
