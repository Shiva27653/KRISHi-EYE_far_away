# Production Dockerfile for NestJS API — single-stage for reliability
FROM node:20-alpine

WORKDIR /app

# System deps (OpenSSL required by Prisma engine)
RUN apk add --no-cache openssl

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
RUN npx prisma generate
RUN pnpm run build

EXPOSE 3000

ENV NODE_ENV=production

# Run migrations then start (0.0.0.0 binding handled in main.ts)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
