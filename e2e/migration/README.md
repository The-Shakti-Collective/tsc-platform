# CoreKnot migration — E2E test plan (Agent 9)

Wave 3 validation scaffold for Mongo → Postgres cutover. Canonical migration docs: [`docs/migration/`](../docs/migration/) (01–07, `migration-status.md`).

## Scope

| Layer | What we prove |
|-------|----------------|
| Schema | Prisma validates; migrations apply on target DB |
| ETL | P0 orchestrator dry-run + execute; idempotent re-run |
| Data parity | Sample row counts Mongo vs Postgres (`SyncMapping` + entity tables) |
| API | Health, legacy compat (`coreknot-compat`), P1–P5 domain routes |
| Contract | OpenAPI export path count vs client hooks / `04-api-compatibility.md` |

## Prerequisites

| Env | Required for |
|-----|----------------|
| `DATABASE_URL` | Prisma, ETL load, row checks |
| `MONGODB_URI` | ETL extract (never commit) |
| `REDIS_URL` | `/api/health/ready` redis check (optional locally) |
| `TSC_AUTH_STUB=true` or Clerk test JWT | Authenticated route probes |

```powershell
pnpm install
pnpm db:generate
pnpm --filter @tsc/database exec prisma migrate deploy
```

ETL reference: [`scripts/migrations/coreknot/README.md`](../../scripts/migrations/coreknot/README.md)

## Test matrix (automate later)

### 1. Static / build

- [ ] `pnpm --filter @tsc/database exec prisma validate`
- [ ] `pnpm --filter @tsc/api typecheck`
- [ ] `pnpm --filter @tsc/api build`

### 2. ETL P0

- [ ] `pnpm migrate:coreknot:p0` (dry-run — counts only)
- [ ] `pnpm migrate:coreknot:p0:execute` (staging only)
- [ ] Re-run execute — no duplicate rows (`SyncMapping` uniqueness)

Entity order: organizations → users → artists → leads → projects → tasks → inquiries → gigs.

### 3. Data parity (post-execute)

Automated: `pnpm migrate:coreknot:count-parity` (`e2e/migration/count-parity.mjs`) — compares Mongo P0 collections vs Postgres counts (default tolerance ±5).


Sample per entity (adjust N):

- [ ] Mongo `countDocuments` vs Postgres `COUNT(*)` for P0 collections
- [ ] Spot-check 5 random `externalId` values resolve via `SyncMapping`
- [ ] FK smoke: lead → org, task → project, gig → artist

### 4. HTTP — health (no auth)

- [ ] `GET /api/health` → 200
- [ ] `GET /api/health/live` → 200
- [ ] `GET /api/health/ready` → 200 (db + redis)

### 5. HTTP — legacy compat (`apps/api/src/modules/coreknot-compat/`)

With stub auth (`Authorization: Bearer stub:<id>` or `X-Stub-User-Id`):

- [ ] `GET /api/crm/leads` → 200, `{ leads: [] }` shape
- [ ] `GET /api/projects` → 200, array or legacy list shape
- [ ] `GET /api/tasks` → 200

Stubs documented in [`04-api-compatibility.md`](../docs/migration/04-api-compatibility.md) (audit, stats, config).

### 6. HTTP — P1–P5 domain (native Nest)

See [`reports/coreknot-domain-backend-p1-p3.md`](../../reports/coreknot-domain-backend-p1-p3.md) and `p4-p5` report.

Minimum smoke (authenticated):

- [ ] `/api/users/me`, `/api/inquiries`, `/api/gigs`
- [ ] `/api/releases`, `/api/royalties`, `/api/distribution/channels`
- [ ] `/api/integrations/connections`, `/api/analytics/cumulative`
- [ ] `/api/deals`, `/api/workspace/me`

### 7. OpenAPI

- [ ] `pnpm --filter @tsc/api openapi:export`
- [ ] Path count recorded in [`09-validation-report.md`](../docs/migration/09-validation-report.md)
- [ ] Legacy paths present: `/api/crm/leads`, flat projects/tasks if exported

## Running locally

```powershell
# Terminal 1
pnpm --filter @tsc/api dev

# Seed stub user (V-002 auth harness)
pnpm seed:dev-user

# API smoke (skips automatically if :4000 down)
pnpm test:migration:api-smoke

# Manual probes (PowerShell)
Invoke-WebRequest http://localhost:4000/api/health -UseBasicParsing
```

## Reporting

Each wave boundary: update [`docs/migration/09-validation-report.md`](../docs/migration/09-validation-report.md) pass/fail matrix and overall **PASS | PARTIAL | FAIL**.

## Out of scope (Wave 4)

- Render legacy CRM decommission
- Clerk production cutover
- Full client Playwright suite (track separately under `e2e/` when added)
