# 🏗️ System Architecture

## High-Level Flow

```mermaid
graph LR
    subgraph Clients
        Mobile[Mobile App<br/>Expo 55]
        Web[PWA Web Dashboard<br/>Next.js 16]
    end
    subgraph Backend
        API[NestJS 11 API]
        AI[FastAPI AI Service]
    end
    subgraph Knowledge & Pipeline
        CV[CV Pipeline<br/>YOLOv8n-seg + MobileNetV2]
        FTS[PostgreSQL FTS<br/>Grounded knowledge base]
    end
    Mobile --> API
    Web --> API
    API --> AI
    AI --> CV
    API --> FTS
```

## Request Flow (AI Advisory)

```mermaid
sequenceDiagram
    participant F as Farmer (Web PWA)
    participant SW as Service Worker (SWR Cache)
    participant API as NestJS API
    participant FTS as PG Full-Text Search

    F->>+SW: Ask agricultural question
    SW->>KB: Check SWR Cache
    KB-->>F: Immediate cached response (if available)
    SW->>+API: Fetch fresh data (background)
    API->>FTS: Tiered Retrieval (Strict -> AND -> Anchored OR)
    FTS-->>API: Grounded snippets
    API-->>-SW: Fresh grounded response
    SW->>KB: Update SWR Cache
    SW-->>-F: Fresh response + Citations
```

## Security Architecture

| Layer | Implementation |
|-------|----------------|
| **Transport** | SSL/TLS enforced on Render and Vercel. |
| **Authentication** | JWT stored in **HttpOnly, Secure, SameSite=Strict** cookies. |
| **Response Safety** | `headersSent` guard in `AllExceptionsFilter` to prevent socket crashes. |
| **Headers** | `Helmet` integration for CSP, XSS protection, and HSTS. |
| **Data Access** | Parameterized Raw SQL via `Prisma.sql` to prevent SQL injection. |
| **PWA Security** | Network-only fallback for all Auth/POST requests in Service Worker. |

## RAG & Knowledge Engine

The Advisory system has been refactored from legacy Vector search to a robust, tiered **Full-Text Search (FTS)** strategy:
- **Tier 1 (Strict Websearch)**: Exact phrase matching.
- **Tier 2 (Standard AND)**: All keywords must be present.
- **Tier 3 (Anchored OR)**: Mandatory crop name + flexible descriptive terms.
- **Ranking**: `ts_rank` with positional relevance for high-precision results.
- **Data**: 50,000+ records from BhashaBench, SARTHI, and KCC datasets.

## PWA Capabilities

KRISHi-EYE is implemented as a full Phase 2 Progressive Web App:
- **Phase 1 (Basic)**: Offline fallback, home-screen installation, and static asset caching.
- **Phase 2 (Advanced)**: 
  - **SWR Caching**: Instantly serve previous Advisor results while updating in background.
  - **Push Notifications**: VAPID-based alerts for farm updates and new advisories.
  - **Cache Awareness**: UI badges indicating "Cached Result" with staleness timestamps.
