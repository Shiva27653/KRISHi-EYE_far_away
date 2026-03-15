# Production Dockerfile for NestJS API — Debian Slim for GLIBC compatibility (ML/ONNX support)
FROM node:20-slim

WORKDIR /app

# System deps:
# - openssl/libssl: Required by Prisma
# - ca-certificates: Required for secure downloads
# - python3/make/g++: Required by sharp/native modules if prebuilts fail
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Minimal package.json context (satisfies pnpm install)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

# Install deps (ALLOW SCRIPTS for sharp/onnxruntime-node native binaries)
RUN pnpm install --frozen-lockfile

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
