# CoreKnot Mongo → Postgres — Full Migration Plan

**Status:** Phase 1 local complete (reads + dual-write) · Phase 2 repos scaffolded · Phase 3 prep done  
**Last updated:** 2026-06-15  
**Scope:** `apps/coreknot/server` (Express/Mongoose) → shared Neon Postgres via `@tsc/database` (Prisma)

---

## Executive summary

CoreKnot CRM runs on **MongoDB Atlas** (`taskmaster_production` / local `taskmaster_local`) with **94 Mongoose models**, **~448 HTTP routes**, and a **tenant plugin** that scopes nearly all queries. TSC Platform already has:

- Canonical Prisma schema in `packages/database/prisma/schema.prisma` (CoreKnot domain P1–P5 models)
- P0 ETL pipeline in `scripts/migrations/coreknot/` (`pnpm migrate:coreknot:p0`)
- Local Postgres via `docker-compose.yml` (`tsc_community` DB on `:5432`)

This plan covers **full runtime cutover** (not just ETL), starting **local-first** with auth/users, then expanding domain-by-domain behind feature flags.

---

## Phase 0 — Discovery inventory

### Mongo model count & domains

| Domain | Models | Key collections | Notes |
|--------|-------:|-----------------|-------|
| **Auth / org** | 16 | `users`, `tenants`, `departments`, `teams`, `workspaces`, preferences | Login before tenant context; `bypassTenant` on auth |
| **Projects / tasks** | 9 | `projects`, `phases`, `tasks`, `taskactivities`, KRAs/goals | Heavy aggregation in analytics |
| **CRM** | 6 | `leads`, `emis`, `crmconfigs`, imports/audit | 32 indexes on `leads`; text search |
| **Mail** | 6 | `campaigns`, `mailcampaigns`, templates, events | Rollup aggregations; Resend webhooks cross-tenant |
| **Artists** | 22 | `artists`, gigs, finance, releases, path | Largest surface area (~67 routes) |
| **Data hub / people** | 9 | `people`, person index/identifiers, sync state | Person graph; cross-inlet processors |
| **Integrations** | 8 | Exly, newsletter, booked calls, masterclass | Webhook-driven writes |
| **Ops / observability** | 18+ | logs, attendance, finance docs, gamification | GridFS backups; Supabase mirror optional |

**Totals:** 94 unique Mongoose models · 98 Mongo collections · ~220k documents (prod audit 2026-06-14)

Canonical audit: [`docs/migration/01-system-audit.md`](../../docs/migration/01-system-audit.md)  
Collection counts: [`docs/migration/mongo-audit.md`](../../docs/migration/mongo-audit.md)

### Prisma overlap (already exists)

| Mongo (legacy) | Prisma (TSC) | ETL status |
|----------------|--------------|------------|
| `tenants` | `Organization` | P0 ✅ |
| `users` | `Person` + `User` + `Identity` + `OrganizationMember` | P0 ✅ (Clerk placeholder IDs) |
| `departments` | — | **Gap** — runtime auth still needs dept permissions |
| `projects` | `Project` + `Workspace` | P0 ✅ |
| `tasks` | `Task` + `TaskAssignee` | P0 ✅ |
| `leads` | `Lead` | P0 ✅ |
| `artists` | `Artist` | P0 ✅ |
| `artistinquiries` | `Inquiry` | P0 ✅ |
| `artistgigs` | `Gig` | P0 ✅ |

**New transitional models (Phase 1 scaffold):** `CkLegacyTenant`, `CkLegacyDepartment`, `CkLegacyStaffUser` — mirror Mongo auth for local runtime before Clerk cutover.

### Coupling hotspots

| Mechanism | Location | Migration impact |
|-----------|----------|------------------|
| **tenantPlugin** | `plugins/tenantPlugin.js` | Every Prisma query needs `organizationId` / tenant filter equivalent |
| **bypassTenant** | `infrastructure/database/bypassTenantPolicy.js` | Auth, webhooks, data-hub, mail tracking — explicit allowlists |
| **Aggregation pipelines** | CRM stats, mail rollups, dashboard, data-hub | Rewrite as SQL/Prisma raw or materialized views |
| **GridFS** | `databaseBackupService.js` | Replace with Neon PITR + R2; drop GridFS post-cutover |
| **Mongo ObjectId refs** | Throughout | `SyncMapping.externalId` ledger during dual-read period |
| **Supabase secondary** | Optional mirror | Deprecate after Postgres primary |
| **BullMQ workers** | 6 queues | Workers must use Postgres repositories |

---

## Target architecture

```
┌─────────────────────────────────────────────────────────────┐
│  apps/coreknot/server (Express)                             │
│  ┌─────────────┐  feature flags   ┌──────────────────────┐  │
│  │ Controllers │ ───────────────► │ Repository layer     │  │
│  └─────────────┘                  │ mongo │ prisma       │  │
│                                   └──────────┬───────────┘  │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                    ┌──────────────────────────▼──────────────┐
                    │  @tsc/database (Prisma)                 │
                    │  Single Postgres (Neon prod / Docker)   │
                    │  + SyncMapping ledger                   │
                    └─────────────────────────────────────────┘
```

**Decision:** Single Postgres via existing `@tsc/database` — **no** separate `packages/coreknot-db`. Use:

1. **Transitional tables** (`ck_legacy_*`) for domains not yet mapped to canonical TSC models
2. **Canonical models** (`Person`, `Lead`, `Task`, …) for ETL-aligned domains
3. **`SyncMapping`** as idempotency + cross-reference layer (`sourceSystem: coreknot`)

Post-cutover: drop `ck_legacy_*` after Clerk auth replaces password login.

---

## Phased rollout

### Wave 0 — Local foundation (current)

| Task | Owner | Status |
|------|-------|--------|
| Prisma legacy auth models | Agent | ✅ Scaffold |
| Export Mongo users → JSON | Agent | ✅ `pnpm coreknot:migrate:export-users` |
| Seed legacy auth to Postgres | Agent | ✅ `pnpm coreknot:migrate:seed-auth` |
| Repository + `COREKNOT_AUTH_STORE` flag | Agent | ✅ Read + write (dual-write) |
| Wave 1 P0 dual-write (projects/tasks/CRM/artists) | Agent | ✅ Local |
| Wave 2 P1 repos + flags | Agent | ✅ `ck_legacy_documents` + 9 repos |
| Wave 3 decommission prep | Agent | ✅ GridFS gate, CI dry-run, local profile |
| Local verify runbook | Agent | Documented below |

### Wave 1 — P0 runtime read (local → staging)

| Order | Domain | Flag | Depends on |
|------:|--------|------|------------|
| 1 | Auth / users / departments | `COREKNOT_AUTH_STORE=postgres` | Legacy auth seed |
| 2 | Organizations (tenant context) | `COREKNOT_TENANT_STORE=postgres` | ETL organizations |
| 3 | Projects + workspaces | `COREKNOT_PROJECTS_STORE=postgres` | ETL + tenant |
| 4 | Tasks | `COREKNOT_TASKS_STORE=postgres` | Projects |
| 5 | CRM leads | `COREKNOT_CRM_STORE=postgres` | Users + org |
| 6 | Artists (core) | `COREKNOT_ARTISTS_STORE=postgres` | Org |

### Wave 2 — P1 domains (staging → prod)

Mail campaigns, data-hub person graph, attendance, finance, newsletter, integrations/webhooks, gamification, calendar, notifications.

### Wave 3 — P2 + decommission

Ops logs (→ PostHog/logs), GridFS backup removal, Mongo URI removal, Atlas cluster sunset.

---

## Data migration strategy

### Already built (ETL P0)

```powershell
pnpm db:generate
pnpm migrate:coreknot:p0              # dry-run
pnpm migrate:coreknot:p0:execute      # writes Person/Lead/Task/… + SyncMapping
pnpm migrate:coreknot:count-parity    # Mongo vs Postgres counts
```

Idempotent via `SyncMapping` (`sourceSystem: coreknot`, `eventType: migration_v1`).

### Runtime auth slice (new)

```powershell
pnpm coreknot:migrate:export-users    # Mongo → scripts/migrations/coreknot/out/users-export.json
pnpm db:push                          # apply ck_legacy_* tables locally
pnpm coreknot:migrate:seed-auth       # JSON → Postgres
# apps/coreknot/server/.env:
# COREKNOT_AUTH_STORE=postgres
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tsc_community
```

### Dual-write vs ETL-only

| Phase | Strategy |
|-------|----------|
| Local dev | **ETL + read failover + dual-write** — Mongo primary writes; Postgres mirror when flag=postgres |
| Staging | **Dual-write** for pilot domains (auth, then projects) |
| Prod cutover | **Freeze Mongo writes** → final ETL delta → flip flags → 48h monitor |

No continuous dual-write until staging Wave 1 — minimizes complexity.

---

## Cutover criteria

Per domain, all must pass:

- [ ] `pnpm migrate:coreknot:count-parity` within tolerance
- [ ] E2E auth smoke (`pnpm test:e2e:coreknot`) with Postgres flag
- [ ] No P0 errors in CoreKnot `/api/health` (`mongodb.state` + postgres ping)
- [ ] Rollback flag tested (`COREKNOT_*_STORE=mongo`)

### Rollback

1. Set domain flag back to `mongo`
2. Restart CoreKnot server
3. If bad Postgres data: delete `SyncMapping` rows for entity + `ck_legacy_*` rows; re-seed from export
4. Nuclear: Neon branch restore / `docker compose down -v` locally

---

## Environment variables (local dev)

| Variable | Where | Purpose |
|----------|-------|---------|
| `MONGODB_URI` | `apps/coreknot/server/.env` | Legacy primary (default) |
| `DATABASE_URL` | root `.env` + server `.env` | Postgres for Prisma |
| `COREKNOT_AUTH_STORE` | server `.env` | `mongo` (default) \| `postgres` |
| `COREKNOT_*_STORE` | server `.env` | Per-domain — see `.env.example` |
| `COREKNOT_MONGO_REQUIRED` | server `.env` | `true` (default) \| `false` for local all-postgres |
| `COREKNOT_DISABLE_GRIDFS_BACKUP` | server `.env` | `true` to skip GridFS (Neon PITR + R2) |
| `COREKNOT_POSTGRES_ENABLED` | server `.env` | Master kill-switch for any Prisma path |

Local Postgres (Docker):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tsc_community
```

---

## Founder tasks vs agent tasks

### Founder (blocks prod)

| ID | Task |
|----|------|
| F1 | Neon production DB + `DATABASE_URL` on Render/Railway CoreKnot API |
| F2 | Clerk bulk import — replace `coreknot_pending_*` placeholder `User.clerkUserId` |
| F3 | Atlas read-only URI for final prod ETL delta |
| F4 | DNS / deploy CoreKnot API with Postgres env |
| F5 | Mongo Atlas sunset approval after 30-day parallel run |

### Agent (can proceed now)

| ID | Task |
|----|------|
| A1 | ✅ This plan + legacy auth scaffold |
| A2 | Tenant context from Postgres `Organization` |
| A3 | Projects/tasks repository layer |
| A4 | CRM lead repository (read path) |
| A5 | Remove GridFS backup path after R2/Neon PITR documented |
| A6 | CI job: `migrate:coreknot:p0` dry-run on PR |

---

## Local verification steps

```powershell
# 1. Infra
pnpm infra:up
pnpm db:push
pnpm db:generate

# 2. Export + seed auth (requires MONGODB_URI in apps/coreknot/server/.env)
pnpm coreknot:migrate:export-users
pnpm coreknot:migrate:seed-auth

# 3. Flip flag in apps/coreknot/server/.env
# COREKNOT_AUTH_STORE=postgres
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tsc_community

# 4. Start stack
pnpm start:coreknot:nodocker

# 5. Smoke login
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"dev-admin@example.com\",\"password\":\"...\"}"

# 6. Rollback test
# COREKNOT_AUTH_STORE=mongo
```

---

## Estimated timeline (full migration)

| Phase | Scope | Estimate |
|-------|-------|----------|
| **0** | Discovery + plan + auth scaffold | 1–2 days ✅ |
| **1** | P0 runtime (auth, org, projects, tasks, CRM, artists core) | 2–3 weeks |
| **2** | P1 (mail, data-hub, attendance, finance, webhooks) | 3–4 weeks |
| **3** | P2 (ops, GridFS removal, Mongo sunset) | 1–2 weeks |
| **Total** | Full cutover | **6–9 weeks** (agent work; + founder Clerk/Neon) |

### Google OAuth (Wave 1 gap — documented)

Staff Google login (`googleLogin`, `googleAuthCallback`) still creates/updates Mongo `User` documents first. When `COREKNOT_AUTH_STORE=postgres`:

- Password/profile fields sync via `toAuthUserShape().save()` and `createStaffUser` mirror
- `googleId`, `googleAccounts[]`, OAuth tokens remain Mongo-primary until Clerk cutover (founder task F2)
- **Local workaround:** use dev bypass or password login with postgres auth seed

Post-cutover: Clerk owns OAuth; legacy `googleId` fields deprecated per [02-schema-mapping.md](../../docs/migration/02-schema-mapping.md).

### Ops logs (Wave 3)

Mongo `SystemLog` / `Log` collections → route to PostHog logs + BetterStack heartbeat (R0 scaffold). No Prisma mirror in Wave 2; disable Mongo log persistence with `PERSIST_SYSTEM_LOGS=false` when PostHog OTLP configured.

---

- [`docs/migration/01-system-audit.md`](../../docs/migration/01-system-audit.md)
- [`docs/migration/02-schema-mapping.md`](../../docs/migration/02-schema-mapping.md)
- [`scripts/migrations/coreknot/README.md`](../../scripts/migrations/coreknot/README.md)
- [`docs/migration/LOCAL-READINESS-REPORT.md`](../../docs/migration/LOCAL-READINESS-REPORT.md)
