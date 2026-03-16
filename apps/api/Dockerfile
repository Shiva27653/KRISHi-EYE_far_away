# Production Dockerfile — Debian Slim (glibc support for ONNX/Sharp)
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Minimal package.json context
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

# Install dependencies (shamefully-hoist for better binary resolution)
RUN pnpm install --no-frozen-lockfile --shamefully-hoist

# Explicitly rebuild sharp for linux-x64
RUN npm rebuild sharp --platform=linux --arch=x64

# Build shared types
COPY packages ./packages
WORKDIR /app/packages/types
RUN pnpm run build

# Build API
WORKDIR /app/apps/api  
COPY apps/api ./  
# Dummy DB URL for generation
RUN DATABASE_URL="file:./dev.db" npx prisma generate
RUN pnpm run build

EXPOSE 10000

ENV NODE_ENV=production

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
