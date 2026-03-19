# Deployment Guide

This document outlines the steps to deploy the KRISHI-EYE platform to production environments like Render and Vercel.

## 🚀 Deployment Overview

| Component | Platform | Configuration |
|-----------|----------|---------------|
| **Web Dashboard** | Vercel | Next.js Autodetect |
| **API Backend** | Render | Docker or Node Engine |
| **AI Service** | Render | Python/Docker Engine |
| **Database** | Supabase/Neon | PostgreSQL + pgvector |

---

## 🌐 Web Dashboard (Vercel)

1. Connect your GitHub repository to Vercel.
2. Select the `apps/web` directory as the root.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed NestJS API.
4. Deploy.

---

## ⚙️ Backend API (Render)

1. Create a "Web Service" on Render.
2. Set the Root Directory to `apps/api`.
3. Select "Node" as the runtime.
4. Configuration:
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start:prod`
5. Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: A secure random string.
   - `NODE_ENV`: `production`

---

## 🤖 AI Service (Render)

1. Create a "Web Service" on Render.
2. Set the Root Directory to `apps/ai-service`.
3. Select "Python" as the runtime.
4. Configuration:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Environment Variables:
   - `OPENAI_API_KEY`: For LLM-based advisory generation.

---

## 📦 Database Migration

Ensure your production database has `pgvector` and `postgis` enabled.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
```

Run Prisma migrations:
```bash
npx prisma migrate deploy
```

---

## 🛠️ Secondary Verification: Local Bootstrap (Fallback)
If the primary cloud domains are unreachable due to DNS propagation, evaluators can natively spin up the exact production architecture on their local machine.

Because KRISHi-EYE relies on advanced spatial geometry calculations (`Unsupported("geography")` WKT POINTS), **Docker Desktop is strictly required for local testing**. 

1. Ensure **Docker Desktop** (with WSL2) and **Node.js v20+** are installed.
2. From the repository root, start the PostGIS instance: `docker compose up -d`
3. Push the Prisma schema: `cd apps/api && npx prisma db push --accept-data-loss`
4. Start processes in separate terminals:
   - `cd apps/api && npm run start:dev`
   - `cd apps/web && npm run dev`
5. Visit `http://localhost:3001`. Log in with `+919999999999` and OTP `123456`.
6. Use the provided telemetry simulation artifacts located in `scripts/` (e.g. `.\scripts\test-telemetry.ps1`) to securely test real-time WKT ingestion and tracking across the WebSocket layer!
