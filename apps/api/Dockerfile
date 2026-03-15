# Production Dockerfile for NestJS API — Debian Slim for GLIBC compatibility (ML/ONNX support)
FROM node:20-slim

WORKDIR /app

# System deps (OpenSSL required by Prisma, ca-certificates for downloads, glibc is native)
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Minimal package.json context (satisfies pnpm install)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

# Install deps FIRST
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build types THEN API
COPY packages ./packages
WORKDIR /app/packages/types
RUN pnpm run build

WORKDIR /app/apps/api  
COPY apps/api ./  
RUN DATABASE_URL="postgresql://postgres:password@localhost:5432/db" npx prisma generate
RUN pnpm run build

EXPOSE 3000

ENV NODE_ENV=production

# Run migrations then start (0.0.0.0 binding handled in main.ts)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
