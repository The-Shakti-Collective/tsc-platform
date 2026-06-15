# CoreKnot production cutover — Neon primary

**Target architecture:** Neon Postgres (main) · Mongo Atlas (30-day dual-write shadow) · R2 (media, P2) · Neon PITR (backups). **No Supabase** for new deployments.

---

## Phase A — Parallel run (deploy now)

Postgres serves reads; Mongo still receives dual-writes for P0 domains. Safe rollback: flip flags to `mongo`.

### 1. One-time ETL (founder / ops)

```powershell
pnpm db:generate
pnpm db:push
pnpm migrate:coreknot:p0:execute
pnpm coreknot:migrate:export-users
pnpm coreknot:migrate:seed-auth
pnpm migrate:coreknot:count-parity
```

Expect **WITHIN_TOLERANCE**. Fix deltas before prod deploy.

### 2. Railway / Render env (API + worker)

**Secrets (Dashboard):**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon production connection string |
| `MONGODB_URI_PROD` | Atlas `taskmaster_production` (dual-write) |
| `JWT_SECRET` | 64+ char secret |
| `ENCRYPTION_KEY` | 64 hex chars |
| `REDIS_URL` | Upstash / Railway Redis |
| `RESEND_API_KEY` | Resend production key |

**Non-secret (in `render.yaml` or Railway env):**

```env
COREKNOT_POSTGRES_ENABLED=true
COREKNOT_AUTH_STORE=postgres
COREKNOT_TENANT_STORE=postgres
COREKNOT_PROJECTS_STORE=postgres
COREKNOT_TASKS_STORE=postgres
COREKNOT_CRM_STORE=postgres
COREKNOT_ARTISTS_STORE=postgres
COREKNOT_DISABLE_GRIDFS_BACKUP=true
BACKUP_DESTINATION=neon
SUPABASE_SECONDARY_ENABLED=false
LOGS_PRIMARY_SUPABASE=false
NODE_ENV=production
RUN_WORKERS=false   # API only
```

Worker service: same secrets + `RUN_WORKERS=true`.

### 3. Validate before DNS cutover

```powershell
pnpm migrate:coreknot:verify-cutover:ping
curl https://api.coreknot.in/api/health/ready
```

Ready payload should show `dependencies.postgres.ok: true` and `migration.allP0OnPostgres: true`.

### 4. Smoke

```powershell
pnpm test:e2e:coreknot
```

Login, CRM lead list, task board, project create.

---

## Phase B — Mongo sunset (after 30 days)

When parity stable and Wave 2 domains migrated or accepted as read-only from Postgres legacy docs:

```env
COREKNOT_MONGO_REQUIRED=false
# Remove MONGODB_URI_PROD from API + worker
```

**Blockers before Phase B:**

- Mail, finance, attendance still use Mongo directly in many controllers
- Run Wave 2 ETL + flip P1 flags per domain
- Confirm no Supabase dependency (`SUPABASE_SECONDARY_ENABLED=false`)

---

## Backups

| Old | New |
|-----|-----|
| Mongo GridFS | **Disabled** (`COREKNOT_DISABLE_GRIDFS_BACKUP=true`) |
| Supabase bucket | **Disabled** (`SUPABASE_SECONDARY_ENABLED=false`) |
| Daily cron | No-op with `BACKUP_DESTINATION=neon` — relies on **Neon PITR** |

Enable Neon PITR on production branch in Neon console. Optional: R2 cold archive per `docs/migration/06-storage-migration.md`.

---

## Rollback

1. Set all `COREKNOT_*_STORE=mongo` (or unset postgres flags).
2. Redeploy API + worker.
3. Mongo remains source of truth during parallel run.

---

## Related

- [coreknot-production-runbook.md](../coreknot-production-runbook.md)
- [migration-local-status.md](./migration-local-status.md)
- [LOCAL-READINESS-REPORT.md](./LOCAL-READINESS-REPORT.md)
