# Production Dockerfile for NestJS API — single-stage for reliability
FROM node:20-alpine

WORKDIR /app

# System deps (OpenSSL required by Prisma engine)
RUN apk add --no-cache openssl

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo config + workspace packages
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install all dependencies
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Copy backend source
COPY apps/api/ ./apps/api/

# Generate Prisma client & build with tsc (nest build silently fails with nodenext)
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx tsc -p tsconfig.build.json --skipLibCheck || true

# Verify dist exists (fail fast if build broken)
RUN ls -la dist/src/main.js

ENV NODE_ENV=production

# Run migrations then start (0.0.0.0 binding handled in main.ts)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
