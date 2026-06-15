# Disaster Recovery Certificate (Agent 24)

> **Date:** 2026-06-15  
> **Verdict:** **FAIL** — procedures documented at high level; Redis/R2 recovery gaps; Mongo backup path being sunset; not tested.

Cross-reference: [RUNBOOK.md](../RUNBOOK.md) · [OPERATIONS.md](../OPERATIONS.md) · [PRODUCTION-CUTOVER.md](../migration/PRODUCTION-CUTOVER.md)

---

## Recovery procedures (documented vs configured)

| Asset | Backup method | Documented | Actually configured | Tested |
|-------|---------------|------------|---------------------|--------|
| **Neon PostgreSQL** | PITR (point-in-time restore) | ✅ RUNBOOK, OPERATIONS, DEPLOYMENT | ⚠️ Founder Neon access required | ❌ |
| **MongoDB (CoreKnot)** | Atlas backups + GridFS | ⚠️ Sunset path | ✅ If Atlas provisioned | ❌ |
| **GridFS backup** | Cron in CoreKnot | ⚠️ Being disabled | `COREKNOT_DISABLE_GRIDFS_BACKUP=true` target | ❌ |
| **Redis** | — | ❌ Not documented | Unknown provider | ❌ |
| **R2 object storage** | Versioning/lifecycle | ❌ Not documented | Scaffold only | ❌ |
| **Clerk users** | Clerk dashboard export | ❌ Not in runbook | Clerk SaaS | ❌ |
| **Vercel frontends** | Git + deploy history | ✅ Promote previous deploy | Automatic | ❌ |
| **Railway APIs** | Redeploy previous image | ✅ RUNBOOK | Railway dashboard | ❌ |

---

## Database restore (Neon)

Documented in [RUNBOOK.md](../RUNBOOK.md):

> Database | Neon → Restore branch (founder approval)

**Gap:** No step-by-step runbook with RTO/RPO targets, branch naming, or post-restore migration verification (`prisma migrate deploy` status).

**P0 action:** Document Neon restore drill:

1. Create branch from PITR timestamp
2. Point staging `DATABASE_URL` at branch
3. Run `pnpm sweep:prod` / smoke tests
4. Swap production connection string (founder only)

---

## Redis recovery

| Question | Answer |
|----------|--------|
| Persistence mode | Not documented (AOF/RDB?) |
| Queue job loss on flush | BullMQ jobs may be lost |
| Failover | Not documented |

**P1:** Document Redis provider (Upstash vs Railway KV), backup tier, and queue durability expectations.

---

## Railway redeploy

| Step | Documented |
|------|------------|
| Rollback to previous deployment | ✅ RUNBOOK |
| Zero-downtime deploy | Railway default |
| Worker service rollback | ⚠️ Mention separately |

Health check grace: Platform 300s, CoreKnot 120s per `railway.toml`.

---

## Vercel rollback

| App | Procedure |
|-----|-----------|
| Website, Community, CoreKnot client | Deployments → Promote to Production ✅ |

Instant rollback — no build required.

---

## CoreKnot-specific DR

| Item | Status |
|------|--------|
| `databaseBackupService.js` | GridFS → **sunset** |
| `BACKUP_DESTINATION=neon` | Documented in cutover docs |
| Dual-write period | Mongo + Postgres — **consistency risk on restore** — restore one store only without parity check |

**P0 during cutover:** Run `pnpm migrate:coreknot:count-parity` after any DB restore.

---

## Monitoring & alerting

| Tool | DR relevance | Status |
|------|--------------|--------|
| Sentry | Error spike detection | Scaffold |
| PostHog | Not DR | Active |
| BetterStack heartbeat | Uptime | Scaffold only (L3) |

No automated failover — manual founder intervention required.

---

## RTO / RPO (proposed — not approved)

| Tier | RPO | RTO | Notes |
|------|-----|-----|-------|
| Neon Postgres | 1h (PITR) | 4h | Depends on Neon plan |
| Mongo (legacy) | 24h | 8h | Until sunset |
| Redis queues | 0 (ephemeral) | 1h | Replay from source |
| Frontends | 0 (git) | 15m | Vercel promote |

---

## Certification

| Criterion | Result |
|-----------|--------|
| DB backup documented | ⚠️ Partial |
| Restore procedure tested | ❌ |
| Redis recovery documented | ❌ |
| Railway/Vercel rollback documented | ✅ |
| End-to-end DR drill | ❌ |

**Agent 24 verdict: FAIL**
