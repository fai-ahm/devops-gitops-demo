# syntax=docker/dockerfile:1

# ---- 1. deps: install node_modules from the lockfile (cached unless package*.json changes)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- 2. builder: compile the Next.js app into .next/standalone
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- 3. runner: only the compiled output, no source, no dev dependencies
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Declared late on purpose: a new version only changes this layer, so earlier layers stay cached
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

# The official node image ships a non-root "node" user (uid 1000). Numeric, so Kubernetes
# runAsNonRoot can verify it's not root (it can't resolve user names).
USER 1000:1000
EXPOSE 3000
CMD ["node", "server.js"]
