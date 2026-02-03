# Vercel Deployment Guide

This guide explains how to deploy the ORIGINER platform to Vercel.

## Project Structure

- **Frontend**: Next.js app in `/frontend` directory
- **Backend**: Fastify server wrapped as Vercel serverless functions in `/api` directory

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. GitHub repository connected to Vercel
3. Environment variables configured (see below)

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `LincolnNE/Originer`
4. Vercel will auto-detect the project structure

### 2. Configure Build Settings

Vercel should auto-detect the Next.js frontend. The `vercel.json` configuration handles:
- Frontend build from `/frontend` directory
- API routes proxied to serverless functions
- Environment variables

### 3. Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

**Required:**
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=https://your-domain.vercel.app` (update after first deployment)

**Optional (based on your setup):**
- `CORS_ORIGIN` - CORS allowed origins (default: `*`)
- `LOG_LEVEL` - Logging level (default: `info`)
- `PROMPT_CONFIG_PATH` - Path to prompt configs (default: `config/prompts`)

**LLM Provider (choose one):**
- `LLM_PROVIDER` - e.g., `openai`, `anthropic`, `local`
- Provider-specific API keys (e.g., `OPENAI_API_KEY`)

**Storage Provider (choose one):**
- `STORAGE_PROVIDER` - e.g., `postgres`, `mongodb`, `memory`
- Provider-specific connection strings (e.g., `DATABASE_URL`)

See `.env.example` for all available variables.

### 4. Deploy

1. Click "Deploy" in Vercel Dashboard
2. Vercel will:
   - Install dependencies (`npm install` in root and frontend)
   - Build the frontend (`cd frontend && npm run build`)
   - Deploy serverless functions from `/api` directory
   - Deploy the Next.js app

### 5. Update API URL

After deployment, update `NEXT_PUBLIC_API_URL` in Vercel environment variables to match your deployment URL:
```
NEXT_PUBLIC_API_URL=https://your-project.vercel.app
```

Then redeploy to apply the change.

## Architecture

### Frontend (Next.js)
- Deployed as a standard Next.js application
- Routes: `/`, `/assess/[sessionId]`, `/lessons/[sessionId]/[screenId]`
- API calls proxied to `/api/v1/*` which routes to serverless functions

### Backend (Serverless Functions)
- Fastify server wrapped as Vercel serverless function
- Located at `/api/serverless/[...path].ts`
- Handles all `/api/v1/*` routes:
  - `/api/v1/sessions` - Session management
  - `/api/v1/lessons/*` - Lesson operations
  - `/health` - Health check endpoint

## Local Development

1. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Start backend (port 4094):
   ```bash
   npm run dev
   ```

4. Start frontend (port 3000):
   ```bash
   cd frontend && npm run dev
   ```

## Troubleshooting

### Build Failures
- Check that all dependencies are listed in `package.json` and `frontend/package.json`
- Ensure TypeScript compiles without errors
- Check build logs in Vercel Dashboard

### API Routes Not Working
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check serverless function logs in Vercel Dashboard
- Ensure backend routes are properly registered

### Environment Variables
- Variables must be set in Vercel Dashboard (not just `.env` files)
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Other variables are server-only

## Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update `NEXT_PUBLIC_API_URL` to match your custom domain
4. Redeploy

## Monitoring

- View deployment logs in Vercel Dashboard
- Check serverless function logs under "Functions" tab
- Monitor API usage and performance in Vercel Analytics
