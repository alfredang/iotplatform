# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Shared image for both the Next.js web app and the MQTT ingestion worker.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
# Prisma needs OpenSSL on Alpine.
RUN apk add --no-cache openssl

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
# Bring in installed deps, the generated Prisma client, build output and source
# (the worker runs from TypeScript source via tsx).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

EXPOSE 3000
# Default command runs the web app. The worker service overrides this.
CMD ["npm", "run", "start"]
