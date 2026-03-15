# Production Dockerfile for NestJS API — Debian Slim with Native Binary Optimization
FROM node:20-slim

WORKDIR /app

# System deps:
# - openssl/libssl: Required by Prisma
# - ca-certificates: Required for secure downloads
# - python3/make/g++: Required for native module compilation
# - libvips-dev: Specifically for sharp support
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    ca-certificates \
    python3 \
    make \
    g++ \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Minimal package.json context
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

# Install deps with SHAMEFULLY-HOIST (crucial for finding native binaries in deep trees)
# Also ensuring we don't ignore scripts to allow sharp binary downloads
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Build shared types
COPY packages ./packages
WORKDIR /app/packages/types
RUN pnpm run build

# Build API
WORKDIR /app/apps/api  
COPY apps/api ./  
RUN DATABASE_URL="postgresql://postgres:password@localhost:5432/db" npx prisma generate
RUN pnpm run build

# Force rebuild of native modules to ensure they match the container environment
RUN pnpm rebuild sharp onnxruntime-node

EXPOSE 3000

ENV NODE_ENV=production

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
