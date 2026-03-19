# 🛠️ KRISHi-EYE Tech Stack

## Web Dashboard (`apps/web`)
- **Framework**: Next.js 16 (App Router) with React 19.
- **Styling**: Tailwind CSS v4 + Vanilla CSS + Lucide Icons.
- **PWA**: Custom `sw.js` (No Workbox) for lightweight execution.
- **State/Hooks**: `usePush` for notifications, `apiRequest` for PWA-aware data fetching.

## Backend Service (`apps/api`)
- **Core**: NestJS v11 (Node.js).
- **ORM**: Prisma v5 (PostgreSQL).
- **Search**: PostgreSQL Full-Text Search (TSVector) for grounded RAG.
- **Auth**: OTP-based authentication with response-guarded JWT.

## AI & Data Pipeline
- **FastAPI**: Lightweight service for Vision and RAG logic support.
- **Ingestion**: Standalone Python CLI (`scripts/ingest-all.py`) for production data loads.
- **Models**: YOLOv8n-seg for leaf segmentation (Production Vision Pipeline).

## Infrastructure & Deployment
- **API/AI Hosting**: Render.com (HTTP services with health check paths).
- **Web Hosting**: Vercel (Production Next.js deployment).
- **Database**: Managed PostgreSQL (with GIN indexes for FTS).

## Security & Reliability
- **Response Guards**: Preventing double-send Crashes (`AllExceptionsFilter`).
- **Network Safety**: Service Worker ignores all non-safe GET requests.
- **Schema Hardening**: Database-independent UUID generation for better portability.
