# ─────────────────────────────────────────────────────────────
# Mars Space LMS API — multi-stage build
#
# The runtime stage carries only production dependencies, compiled output
# and the Prisma schema, so the shipped image contains no TypeScript
# sources, tests or build toolchain. The seeder is compiled too, which is
# why the runtime never needs ts-node.
# ─────────────────────────────────────────────────────────────

# ── Stage 1: dependencies ────────────────────────────────────
FROM node:20-alpine AS deps

# Prisma's query engine needs OpenSSL on Alpine.
RUN apk add --no-cache openssl

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: build ───────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.build.json tsconfig.seed.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm prisma generate \
  && pnpm build \
  && pnpm exec tsc -p tsconfig.seed.json

# Drop dev dependencies from the tree that is copied forward.
RUN pnpm prune --prod

# ── Stage 3: runtime ─────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-seed ./dist-seed
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# Uploads are written at runtime; the compose file mounts a volume here.
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Compose overrides this with a migrate + seed + start chain; on its own the
# image simply serves the API.
CMD ["node", "dist/main.js"]
