# tsc-api — DEPRECATED

> **Do not extract.** Use `tsc-platform/apps/api`. See [DEPRECATED.md](./DEPRECATED.md).

# tsc-api (historical scaffold)

NestJS backend — single source of truth for TSC business data.

## Source migration

Extract from monorepo:

- `apps/api/` → repository root
- `packages/database/` → `prisma/` (95-model schema)
- Internal packages: `graph`, `analytics`, `reputation`, `search`, `workspace`, `projects`, `tasks`

## Domains

| Environment | URL |
|-------------|-----|
| Production | `https://api.theshakticollective.in` |
| Staging | `https://api-staging.theshakticollective.in` |

## Stack

- NestJS, TypeScript, Prisma, PostgreSQL, Redis, BullMQ, Typesense
- Deploy: **Railway** (`railway.json`)

## Local development

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Watch mode |
| `pnpm build` | Production build |
| `pnpm start` | Run compiled app |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests |
| `pnpm db:migrate` | Prisma migrate dev |

## Dependencies

Published from `tsc-shared`:

- `@tsc/types`, `@tsc/contracts`, `@tsc/permissions`

Configure `.npmrc` for GitHub Packages (see `tsc-shared/README.md`).

## CI/CD

`.github/workflows/ci.yml` — lint, typecheck, test, build, deploy to Railway on `develop` / `main`.
