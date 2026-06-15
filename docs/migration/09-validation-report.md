# 09 — CoreKnot migration validation report (Agent 9)

**Date:** 2026-06-14  
**Wave:** 3 — Test & validation (post Wave 2 build)  
**Environment:** Local dev — API `http://localhost:4000`, Neon `DATABASE_URL` present, `MONGODB_URI` absent  
**References:** [01-system-audit](./01-system-audit.md) · [02-schema-mapping](./02-schema-mapping.md) · [03-domain-mapping](./03-domain-mapping.md) · [04-api-compatibility](./04-api-compatibility.md) · [05-auth-migration](./05-auth-migration.md) · [06-storage-migration](./06-storage-migration.md) · [07-integrations](./07-integrations.md) · [migration-status](./migration-status.md) · [ETL README](../../scripts/migrations/coreknot/README.md) · [coreknot-compat](../../apps/api/src/modules/coreknot-compat/)

---

## Executive verdict

| Result | **PARTIAL** |
|--------|-------------|
| Rationale | Build/schema gates pass; ETL dry-run blocked on `MONGODB_URI`; no migrated rows (`SyncMapping` = 0); health OK; authenticated route probes return **500** without configured stub/session (Clerk keys appear non-placeholder); OpenAPI export **413** paths. |

---

## Pass/fail matrix

| # | Check | Command / probe | Expected | Actual | Status |
|---|--------|-----------------|----------|--------|--------|
| 1 | Prisma schema valid | `pnpm --filter @tsc/database exec prisma validate` | Valid | Valid | **PASS** |
| 2 | API typecheck | `pnpm --filter @tsc/api typecheck` | 0 errors | 0 errors | **PASS** |
| 3 | API build | `pnpm --filter @tsc/api build` | Success | 440 files SWC compile | **PASS** |
| 4 | ETL P0 dry-run | `pnpm migrate:coreknot:p0` | Counts, no writes | Exit 1: `Missing required env: MONGODB_URI` | **BLOCKED** |
| 5 | ETL execute | `pnpm migrate:coreknot:p0:execute` | Not run | Blocked on #4 | **BLOCKED** |
| 6 | Postgres migration rows | `SyncMapping` count | >0 after execute | **0** | **SKIP** |
| 7 | Mongo vs PG spot counts | Per-entity sample | Within tolerance | No Mongo URI + no load | **SKIP** |
| 8 | Health | `GET /api/health` | 200 | 200 `status: ok` | **PASS** |
| 9 | Liveness | `GET /api/health/live` | 200 | 200 | **PASS** |
| 10 | Readiness | `GET /api/health/ready` | 200 | 200 `database: ok`, `redis: ok` | **PASS** |
| 11 | Legacy CRM | `GET /api/crm/leads` | 401/200 with auth | **500** (no auth) | **FAIL** |
| 12 | Legacy projects | `GET /api/projects` | 401/200 with auth | **500** | **FAIL** |
| 13 | Legacy tasks | `GET /api/tasks` | 401/200 with auth | **500** | **FAIL** |
| 14 | Domain P1–P5 sample | `/api/inquiries`, `/api/gigs`, `/api/releases`, … | 401/200 with auth | **500** (unauthenticated probes) | **FAIL** |
| 15 | Missing routes | `/api/contracts`, `/api/campaigns`, `/api/finance/invoices` | Registered or 401 | **404** | **PARTIAL** (path not mounted or prefix differs) |
| 16 | OpenAPI export | `pnpm --filter @tsc/api openapi:export` | Writes JSON | OK → `apps/api/openapi/tsc-api.openapi.json` | **PASS** |
| 17 | OpenAPI path count | `paths` keys in spec | Baseline tracked | **413** (prior committed artifact ~367) | **PASS** |

---

## ETL dry-run detail

```
[p0] DRY RUN — pass --execute to write
[p0] start organizations
Error: Missing required env: MONGODB_URI
```

**Unblock:** Set founder Mongo Atlas URI locally (see [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md)); re-run dry-run then staging execute.

---

## HTTP probe notes

- Probes run without `Authorization` / valid Clerk JWT. With real `CLERK_SECRET_KEY`, stub auth is off unless `TSC_AUTH_STUB=true`.
- `X-Stub-User-Id: user_dev_stub` still returned **500** on `/api/crm/leads` — likely membership resolution / DB user seed gap; needs follow-up with stub user linked to `Person`/`User`/`OrganizationMember`.
- **404** on some finance/campaign paths may reflect route prefix in modules vs probe URL (see P1–P3 quick reference in domain report).

---

## OpenAPI

| Metric | Value |
|--------|-------|
| Export command | `pnpm --filter @tsc/api openapi:export` |
| Output | `apps/api/openapi/tsc-api.openapi.json` |
| Path count | **413** |
| Legacy samples present | `/api/crm/leads`, `/api/crm/stats`, workspace `{slug}/projects`, `{slug}/tasks` |

---

## Blockers for Wave 3 exit (PASS)

| ID | Item | Owner |
|----|------|-------|
| V-001 | `MONGODB_URI` for ETL dry-run / execute | Founder |
| V-002 | Auth probe harness: stub user + org membership seed, or test Clerk JWT | Agent 6 / 9 |
| V-003 | Fix 500 vs 401 on unauthenticated protected routes (if unintended) | Agent 5 |
| V-004 | Post-execute Mongo↔Postgres count script in `e2e/migration/` | Agent 9 |

---

## Artifacts created

| Path | Purpose |
|------|---------|
| `e2e/migration/README.md` | Repeatable test plan scaffold |
| `docs/migration/09-validation-report.md` | This report |

---

## Changelog

| Date | Event |
|------|-------|
| 2026-06-14 | Agent 9 Wave 3 initial validation — **PARTIAL** |
