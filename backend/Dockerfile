# ── Stage 1: Dependencies ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-libc-compat openssl

COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# ── Stage 2: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-libc-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# ── Stage 3: Runner ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-libc-compat openssl bash

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Entrypoint script para rodar prisma migrate deploy antes de iniciar a API NestJS
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

USER node

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main"]
