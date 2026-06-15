# Mongo Sunset Report

> **Goal:** Zero runtime dependency on MongoDB.  
> **Status (2026-06-15):** **NOT MET** — CoreKnot server requires Mongo for most domains.

## Summary

| Area | Mongo usage | Runtime? |
|------|-------------|----------|
| Platform API (`apps/api`) | None | ✅ Clean |
| Community / Website | None | ✅ Clean |
| Packages / Prisma | None | ✅ Clean |
| CoreKnot server | ~85 Mongoose models, `mongodb` driver | ❌ **Required today** |
| Migration scripts | `scripts/migrations/coreknot/` | Offline only |
| E2E parity | `e2e/migration/count-parity.mjs` | Test only |

**Dependencies:** `apps/coreknot/server/package.json` — `mongoose@^7.0.3`, `mongodb@^6.20.0`

## Classification key

| Action | Meaning |
|--------|---------|
| **REMOVE** | Delete after Postgres cutover verified |
| **REPLACE** | Rewrite to use Prisma/Postgres or R2 |
| **ARCHIVE** | Keep in git for history; not in runtime path |

## Runtime — REMOVE (CoreKnot server)

| Artifact | Path | Replacement |
|----------|------|-------------|
| Mongo connection service | `services/mongoConnectionService.js` | Prisma only |
| `requireMongo` middleware | `middleware/requireMongo.js` | Remove when `COREKNOT_MONGO_REQUIRED=false` |
| Mongoose models (~85) | `models/*.js` | Prisma models + repositories |
| Legacy repositories | `repositories/createLegacyRepository.js`, `createTenantRepository.js` | Prisma repositories |
| GridFS backup | `databaseBackupService.js`, GridFS refs | Neon backups + R2 |
| Mongo sync writer | `services/sync/handlers/mongoSyncWriter.js` | Postgres sync |
| `mongoId.js`, `mongoColdArchiveTtl.js` | utils | cuid/UUID helpers |
| Health Mongo probe | `SystemHealthService.js`, `systemHealthProbeService.js` | Postgres-only readiness |
| Config `MONGODB_URI*` | `config/index.js`, `config/database.js` | Remove from schema |
| Tenant plugin (Mongo) | `plugins/tenantPlugin.js` | Postgres tenant scope |
| Mail campaign Mongo store | `domains/mail/models/MailCampaign.js` | Postgres + R2 attachments |
| Background queue Mongo refs | `services/backgroundQueue.js` | Redis-only |

## Env vars — REMOVE

| Variable | Current use |
|----------|-------------|
| `MONGODB_URI` | Local/dev primary |
| `MONGODB_URI_PROD` | Production primary |
| `MONGO_URI` | Alias |
| `MONGODB_DIRECT_URI` | Windows SRV workaround |
| `MONGODB_DB_LOCAL` / `MONGODB_DB_PROD` | Sync scripts |
| `MONGODB_BACKUP_DB` | GridFS backup DB |
| `MONGO_LOG_ARCHIVE` | Cold archive |
| `MAIL_USE_PROD_DB` | Dangerous prod DB from localhost |

## Migration tooling — ARCHIVE (keep, not runtime)

| Path | Action |
|------|--------|
| `scripts/migrations/coreknot/` | ARCHIVE after cutover complete |
| `scripts/coreknot/migrate-mongo-to-tsc.mjs` | ARCHIVE |
| `e2e/migration/count-parity.mjs` | ARCHIVE or repurpose for Postgres parity |
| `docs/migration/mongo-audit.md` | Move to `docs/archive/` |
| `.specify/migrations/coreknot-mongo-to-postgres.md` | ARCHIVE |
| `apps/coreknot/server/scripts/*` (100+ one-off Mongo scripts) | ARCHIVE — ops history |

## Domain store flags (REPLACE path)

Per-domain cutover via env (`apps/coreknot/server/.env.example`):

| Flag | P0/P1/P2 | Prisma target |
|------|----------|---------------|
| `COREKNOT_AUTH_STORE` | P0 | `User`, `CkLegacyStaffUser` |
| `COREKNOT_TENANT_STORE` | P0 | `Organization`, `CkLegacyTenant` |
| `COREKNOT_PROJECTS_STORE` | P0 | `Project`, `Workspace` |
| `COREKNOT_TASKS_STORE` | P0 | `Task`, assignees |
| `COREKNOT_CRM_STORE` | P0 | `Lead`, `Inquiry` |
| `COREKNOT_ARTISTS_STORE` | P0 | `Artist` |
| `COREKNOT_MAIL_STORE` | P1 | TBD Prisma / R2 |
| `COREKNOT_ATTENDANCE_STORE` | P1 | TBD |
| `COREKNOT_FINANCE_STORE` | P1 | `Expense` + R2 for blobs |
| `COREKNOT_DATAHUB_STORE` | P1 | Person hub tables |
| `COREKNOT_GAMIFICATION_STORE` | P2 | Config snapshots |
| `COREKNOT_NEWSLETTER_STORE` | P2 | Newsletter models |
| `COREKNOT_INTEGRATIONS_STORE` | P2 | `IntegrationConnection` |
| `COREKNOT_NOTIFICATIONS_STORE` | P2 | Split from Platform `Notification` |
| `COREKNOT_CALENDAR_STORE` | P2 | Calendar events |

Master switches:

- `COREKNOT_POSTGRES_ENABLED=true` — enable Prisma paths
- `COREKNOT_POSTGRES_PRIMARY=true` — Postgres authoritative
- `COREKNOT_MONGO_REQUIRED=false` — allow boot without Mongo
- `COREKNOT_DISABLE_GRIDFS_BACKUP=true` — stop GridFS backups

## Platform API — clean

Grep confirms **no** `mongoose`, `mongodb`, or `MONGODB_*` in `apps/api/`. No action needed.

## Exit criteria (zero Mongo)

- [ ] All `COREKNOT_*_STORE=postgres` in production
- [ ] `COREKNOT_MONGO_REQUIRED=false` — server boots without Mongo
- [ ] Health `/api/health/ready` does not check Mongo
- [ ] `mongoose` removed from `package.json`
- [ ] No `MONGODB_*` in production env dashboards
- [ ] 30-day parallel-run complete; Atlas cluster deprovisioned
- [ ] GridFS attachments migrated to R2

## Recommended sequence

1. Complete P0 ETL: `pnpm migrate:coreknot:p0:execute`
2. Flip P0 store flags on staging; run `pnpm migrate:coreknot:count-parity`
3. P1 domains (mail, finance, attendance) — schema + ETL
4. Production parallel-run (Mongo + Postgres) — 30 days per `docs/migration/PRODUCTION-CUTOVER.md`
5. Set `COREKNOT_MONGO_REQUIRED=false`; remove Mongo from Railway env
6. Archive migration scripts; remove Mongoose from dependencies
7. Deprovision MongoDB Atlas

## Risk if Mongo removed prematurely

- Mail campaign dispatch failure (no campaign store)
- Finance document download failure (GridFS)
- Attendance history inaccessible
- CRM lead writes lost if Postgres ETL incomplete

**Do not remove Mongo from production until parity scripts pass and founder signs cutover checklist.**
