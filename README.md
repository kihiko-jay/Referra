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
pnpm --filter @referraios/web dev
```

## Status

- [x] Phase 0 — monorepo foundations, shared domain package
- [ ] Phase 1 — NestJS API, Prisma, auth, multi-tenancy
- [ ] Phase 2 — referral tracking & attribution
- [ ] Phase 3 — double-entry ledger + payments (Daraja / Flutterwave / Stripe)
- [ ] Phase 4 — AI layer (copilot, fraud scoring, optimization, NL analytics)
- [ ] Phase 5 — frontend wired to the real API
- [ ] Phase 6–8 — security, observability, tests, CI/CD, deploy
