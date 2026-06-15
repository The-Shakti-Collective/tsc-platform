# Migration — local environment status

**Updated:** 2026-06-15 — prod Mongo → Neon Postgres sync verified

Tracks local-only validation items from [09-validation-report.md](./09-validation-report.md).  
Full readiness matrix: [LOCAL-READINESS-REPORT.md](./LOCAL-READINESS-REPORT.md) — **Wave 1 = GREEN (writes)** · **Wave 2 = YELLOW (repos + flags, ETL optional)** · **Wave 3 = prep done**

---

## Prod → local sync (2026-06-15T03:16Z)

**Source:** Mongo Atlas `taskmaster_production` (read-only via `MONGODB_URI` in `apps/coreknot/server/.env`)  
**Target:** Neon Postgres (`DATABASE_URL` in repo root `.env`) — **not** Docker `tsc-postgres` (infra skipped; Neon remote)  
**Mongo local mirror:** **Not run** — no local `tsc-mongo`; `MONGODB_URI` targets prod directly; `syncProdToLocal.js` needs separate `MONGODB_URI_PROD` + local `MONGODB_URI`

### Commands run

| Step | Command | Result |
|------|---------|--------|
| Schema | `pnpm db:push` | Already in sync |
| P0 ETL | `pnpm migrate:coreknot:p0:execute` | All P0 rows skipped (already mapped); 0 created |
| Auth export | `pnpm coreknot:migrate:export-users` | 2 tenants, 7 departments, 16 users → `out/users-export.json` |
| Auth seed | `pnpm coreknot:migrate:seed-auth` | 2 tenants, 7 departments, 16 users → `ck_legacy_*` |
| Parity | `pnpm migrate:coreknot:count-parity` | **WITHIN_TOLERANCE** |

### Count parity (Mongo vs Postgres)

| Entity | Mongo | Postgres | Δ | OK |
|--------|------:|---------:|--:|:--:|
| Organizations | 2 | 3 | +1 | ✓ |
| Users | 16 | 19 | +3 | ✓ |
| Artists | 4 | 4 | 0 | ✓ |
| Projects | 34 | 34 | 0 | ✓ |
| Tasks | 374 | 372 | −2 | ✓ |
| Leads | 2,029 | 2,029 | 0 | ✓ |

`SyncMapping` (coreknot): **2,482** rows. Tolerance ±5 per entity.

**Notes:** Org/User deltas are extra non-migration rows in Postgres (seed/dev). Task delta −2 = 2 Mongo tasks without workspace mapping (P0 reported 372 skipped / 374 extracted).

---

## Wave 1 status (P0 runtime)

| Item | Status | Notes |
|------|--------|-------|
| Read paths (auth, tenant, projects, tasks, CRM, artists) | **DONE** | Per-domain `COREKNOT_*_STORE=postgres` |
| **Write paths + dual-write** | **DONE** | Mongo primary → Postgres mirror when flag on |
| Staff user admin CRUD (postgres flag) | **DONE** | `createStaffUser`, expanded `save()`, `deleteStaffUser` |
| Artist writes (postgres flag) | **DONE** | `createArtist` / `saveArtist` + mirror; no null on `findArtistByIdForWrite` |
| Google OAuth postgres path | **DOCUMENTED** | Still Mongo-primary; `googleId`/tokens mirrored via `save()` on linked user |
| Full e2e with stack | **PENDING RUN** | Requires `pnpm start:coreknot:nodocker` + postgres flags in `.env` |

### Wave 1 local commands

```powershell
pnpm infra:up
pnpm db:push
pnpm db:generate
pnpm migrate:coreknot:p0:execute
pnpm migrate:coreknot:count-parity
pnpm coreknot:migrate:export-users
pnpm coreknot:migrate:seed-auth
pnpm start:coreknot:nodocker
pnpm test:e2e:coreknot
pnpm --filter @tsc/coreknot-server test:migration-stores
```

---

## Wave 2 status (P1 domains)

| Domain | Flag | Repository | Status |
|--------|------|------------|--------|
| Mail campaigns | `COREKNOT_MAIL_STORE` | `mailCampaignRepository.js` | **DONE** |
| Data-hub / people | `COREKNOT_DATAHUB_STORE` | `dataHubPersonRepository.js` | **DONE** |
| Attendance | `COREKNOT_ATTENDANCE_STORE` | `attendanceRepository.js` | **DONE** |
| Finance | `COREKNOT_FINANCE_STORE` | `financeRepository.js` | **DONE** |
| Newsletter | `COREKNOT_NEWSLETTER_STORE` | `newsletterRepository.js` | **DONE** |
| Integrations | `COREKNOT_INTEGRATIONS_STORE` | `integrationsRepository.js` | **DONE** |
| Gamification | `COREKNOT_GAMIFICATION_STORE` | `gamificationRepository.js` | **DONE** |
| Calendar | `COREKNOT_CALENDAR_STORE` | `calendarRepository.js` | **DONE** |
| Notifications | `COREKNOT_NOTIFICATIONS_STORE` | `notificationRepository.js` | **DONE** |

Storage: `ck_legacy_documents` (JSON payload + `entityType` + `mongoId`). Factory: `createLegacyRepository.js`.

---

## Wave 3 status (decommission prep)

| Item | Status |
|------|--------|
| GridFS gate (`COREKNOT_DISABLE_GRIDFS_BACKUP=true`) | **DONE** |
| Ops logs → PostHog (documented) | **DONE** — see migration plan |
| Local all-postgres `.env` block | **DONE** — `.env.example` |
| Rollback (flags → mongo) | **MANUAL** — unset flags, restart |
| CI P0 dry-run job | **DONE** — `runtime-validation.yml` |
| Wire `COREKNOT_MONGO_REQUIRED=false` | **DONE** — skips Mongo connect on startup |
| Postgres in `/api/health/ready` | **DONE** — `dependencies.postgres` + `migration` profile |
| `pnpm migrate:coreknot:verify-cutover` | **DONE** — pre-deploy validation script |
| Supabase default off | **DONE** — `SUPABASE_SECONDARY_ENABLED` default `false` |
| Neon backup mode | **DONE** — `BACKUP_DESTINATION=neon` skips GridFS/Supabase |

---

## Validation items

| ID | Item | Status |
|----|------|--------|
| **V-001** | ETL P0 | **RESOLVED** |
| **V-002** | Auth probe harness | **RESOLVED** |
| **V-003** | 401 vs 500 | **RESOLVED** |
| **V-004** | Count parity | **RESOLVED** |
| **V-005** | Jest on Windows path with spaces | **KNOWN** — use `pnpm test:migration-stores` from junction or CI |

---

## Changelog

| Date | Event |
|------|-------|
| 2026-06-15 | Phase A production cutover: migrationProfile, health/postgres, Supabase off, Neon backups, render.yaml |
| 2026-06-15 | Prod Mongo → Neon Postgres sync verified; auth seed refreshed; count parity OK |
| 2026-06-15 | Wave 1 dual-write, Wave 2 repos/flags, Wave 3 prep + docs |
| 2026-06-14 | Wave 1 artists postgres read path |
| 2026-06-14 | **GREEN** — api-smoke 15/15; coreknot e2e 7/7 |
