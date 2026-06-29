# ReferraIOS

Africa's referral & commission operating system — businesses track leads,
automate M-PESA/Flutterwave payouts, and acquire customers through referral
agent networks.

> Re-platformed from a Google AI Studio prototype into a production SaaS.

## Monorepo layout

```
apps/
  web/        Vite + React 19 + Tailwind frontend
  api/        NestJS backend (REST + webhooks + jobs)   [in progress]
packages/
  shared/     Domain types + zod schemas/DTOs (single source of truth)
  config/     Shared tsconfig bases
```

Tooling: **pnpm workspaces + Turborepo**.

## Prerequisites

- Node.js >= 20
- pnpm 9 (`corepack enable pnpm`)

## Common commands

```bash
pnpm install            # install all workspaces
pnpm dev                # run all apps in dev
pnpm build              # build everything (turbo)
pnpm typecheck          # typecheck everything
pnpm lint               # lint everything
pnpm test               # test everything
```

Run a single package, e.g. the web app:

```bash
pnpm --filter @referraios/web dev      # http://localhost:3000
pnpm --filter @referraios/api dev      # http://localhost:4000
```

## Local development

1. Start Postgres + Redis (any local instance, or Docker):
   ```bash
   docker run -d --name referraios-pg -e POSTGRES_USER=referraios \
     -e POSTGRES_PASSWORD=referraios -e POSTGRES_DB=referraios -p 5455:5432 postgres:16-alpine
   ```
2. `cp apps/api/.env.example apps/api/.env` and set `DATABASE_URL`, `JWT_*` secrets
   (and provider keys when testing payments / AI).
3. `pnpm --filter @referraios/api exec prisma migrate deploy && pnpm --filter @referraios/api seed`
4. `pnpm dev` (or run each app separately). Demo logins are printed by the seed
   (all use password `password123`).

## Deployment

`render.yaml` is a one-click Render blueprint: Postgres + Redis (key-value), the
API as a Docker web service (`apps/api/Dockerfile`, migrations run on boot), and
the web app as a static site. Secrets marked `sync: false` (provider keys,
`CORS_ORIGINS`, `VITE_API_URL`) are set in the Render dashboard. CI
(`.github/workflows/ci.yml`) runs typecheck → lint → test (against a Postgres
service, so the ledger golden tests run too) → build on every push/PR.

## Status

- [x] Phase 0 — monorepo foundations, shared domain package
- [x] Phase 1 — NestJS API, Prisma, auth, RBAC, multi-tenancy
- [x] Phase 2 — referral tracking & attribution
- [x] Phase 3 — double-entry ledger + payments (Daraja / Flutterwave / Stripe)
- [x] Phase 4 — AI layer (copilot, fraud scoring, optimization, NL analytics)
- [x] Phase 5 — frontend wired to the real API
- [x] Phase 6–8 — hardening (logging, error envelope, health), CI/CD, Render deploy
