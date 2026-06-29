# Build context is the repo root (see render.yaml dockerContext: .)
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable
# Workspace manifests first for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @referraios/shared build \
  && pnpm --filter @referraios/api exec prisma generate \
  && pnpm --filter @referraios/api build

FROM node:20-alpine AS runtime
WORKDIR /repo
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /repo ./
WORKDIR /repo/apps/api
EXPOSE 4000
# Apply migrations, then start. Render injects DATABASE_URL/secrets at runtime.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/src/main.js"]
