# ==============================================================================
# SAI SMART CUSTOMER VAULT — BACKEND API DOCKERFILE
# Node.js 20 Alpine Multi-Stage Production Build
# ==============================================================================

# Stage 1: Base & Corepack Setup
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Stage 2: Dependencies Installation
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --filter @sai/api...

# Stage 3: Source Code & Compilation
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY tsconfig.json package.json turbo.json pnpm-workspace.yaml ./

# Generate Prisma Client & Build Packages
RUN pnpm --filter @sai/database run generate
RUN pnpm --filter @sai/shared-types run build
RUN pnpm --filter @sai/database run build
RUN pnpm --filter @sai/api run build

# Stage 4: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health/liveness || exit 1

CMD ["node", "apps/api/dist/main.js"]
