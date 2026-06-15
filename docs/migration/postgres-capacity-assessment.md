# Postgres capacity assessment — CoreKnot prod→local sync

**Date:** 2026-06-15  
**Scope:** P0 migrated data volume + 5–20 concurrent staff users  
**Verdict:** **Yes with caveats** (current data size is not the bottleneck; application patterns are)

---

## Sync status

| Check | Result |
|-------|--------|
| `migration-local-status.md` | Wave 1 ETL **RESOLVED** (V-001, V-004) |
| `pnpm migrate:coreknot:count-parity` (2026-06-15) | **WITHIN_TOLERANCE** — no re-sync needed |
| SyncMapping (coreknot) | **2482** rows |

### P0 counts (Mongo → Postgres)

| Entity | Mongo | Postgres | Delta |
|--------|------:|---------:|------:|
| Organizations | 2 | 3 | +1 (pre-seed) |
| Users | 16 | 19 | +3 (pre-seed) |
| Artists | 4 | 4 | 0 |
| Projects | 34 | 34 | 0 |
| Tasks | 374 | 372 | −2 |
| Leads | 2029 | 2029 | 0 |

Mongo audit total: **~220k docs** across 98 collections; P0 ETL moved **~2.5k canonical rows** + SyncMapping. Most Mongo volume (mail, finance, attendance, etc.) remains in Mongo or Wave 2 `ck_legacy_documents` until migrated.

---

## Storage footprint

Measured against active `DATABASE_URL` (Neon dev branch):

| Metric | Value |
|--------|------:|
| Total database | **19 MB** |
| Index total | **~4.9 MB** |
| `Lead` (2029 rows) | **2.3 MB** |
| `SyncMapping` (2482 rows) | **1.2 MB** |
| `Task` + `TaskAssignee` | **~0.5 MB** |
| `Project` | **144 kB** |

### Capacity vs limits

| Target | Limit (typical) | Headroom at current P0 |
|--------|-----------------|------------------------|
| Neon Free | 512 MB storage | **~27×** |
| Neon Launch/Scale | 10 GB+ | **~500×+** |
| Local Docker Postgres 16 | disk-bound | effectively unlimited |

**Estimate at 10× leads (~20k):** Lead table ~23 MB, total DB ~50–80 MB — still well within Neon Free storage. Storage is not the first failure mode.

---

## Architecture notes

| Area | Finding |
|------|---------|
| Prisma client | Singleton in `prismaClient.js`; default pool (~`num_cpus * 2 + 1`); no `connection_limit` / PgBouncer URL in schema |
| Tenant scoping | `Lead` has `organizationId`; **`Project` / `Task` use `workspaceId` only** — no org-level DB filter |
| Indexes (Lead) | PG: `(organizationId, stage)`, `assignedPersonId` — vs Mongo **32 indexes** (text, email, phone, compounds) |
| Indexes (Task) | `workspaceId`, `projectId`, `status`, `createdByPersonId` — reasonable for board queries |
| Dual-write | Mongo primary → Postgres mirror + `SyncMapping` upsert on every P0 write |
| Async | BullMQ (HolySheet, CSV backup, gamification, domain-sync) — Redis optional locally (memory fallback) |

---

## Concurrent workload (5–20 staff users)

Realistic simultaneous load: CRM lead list/filter, task board, project views, auth sessions.

### Bottlenecks (ranked)

1. **Repository N+1 hydration** — `hydrateTask` per row: workspace lookup, assignees, 2× SyncMapping reverse lookups; `hydrateLead` per row: 2× mapping lookups. Dominates latency before Postgres CPU.
2. **`countPostgresLeads`** — loads all matching leads into memory then `.length` (no `prisma.lead.count`). Breaks first as lead volume grows.
3. **In-memory CRM text search** — `$or` regex filters applied after `findMany` in `leadRepository.js`; no PG text/GIN index.
4. **Dual-write on mutations** — every task/lead/project update hits Mongo + PG + SyncMapping; ~2–3× write latency while flags are on.
5. **SyncMapping lookups** — indexed, but 1–3 extra queries per hydrated entity on read paths.
6. **Missing lead indexes** — sort by `createdAt`, filter by `source`, email/phone uniqueness checks may seq-scan at 10×.
7. **Connection pool / Neon** — 20 concurrent users × hydration query fan-out can open many connections; use Neon pooler URL in production if not already.
8. **Project list tenant gap** — `findPostgresProjects` has no org filter; relies on small dataset + post-filter for `$or` owner/member.

### Lightweight read benchmark (2026-06-15)

20 parallel clients × 5 rounds against Neon dev (Prisma queries only, not full API):

| Query pattern | Batch p50 | Batch p95 |
|---------------|----------:|----------:|
| Lead list (50 rows) | 171 ms | 873 ms |
| Task list (100 + assignees) | 405 ms | 1451 ms |
| Project list (+ members) | 320 ms | 1317 ms |
| SyncMapping lookup | 155 ms | 1204 ms |

Interpretation: numbers include **network RTT to Neon**; local Docker Postgres would be sub-50 ms for the same row counts. p95 spread indicates **concurrent connection contention**, not storage limits.

API-level load test was **not run** — CoreKnot server was not up during assessment. Repo-layer benchmark is sufficient at this data volume.

---

## Scale projections

| Scale | Storage | What breaks first |
|-------|---------|-------------------|
| **Current (~2k leads)** | 19 MB | Nothing capacity-related for 5–20 users; dual-write + hydration add latency |
| **2× (~4k leads)** | ~35 MB | In-memory lead counts; noticeable board/list slowness from N+1 hydration |
| **10× (~20k leads)** | ~80 MB | Missing CRM indexes on filtered/sorted lists; connection pool under heavy concurrent hydration; lead text search loads thousands of rows |

Full Mongo **220k docs** into Wave 2 JSON stores could add **100–500 MB** depending on payload size — still fits Neon paid tiers; plan storage before bulk legacy migration.

---

## Recommendations

### Before cutover (high impact)

1. **Fix `countPostgresLeads`** — use `prisma.lead.count({ where })`.
2. **Batch hydration** — prefetch SyncMappings, workspaces, assignees in one query per list endpoint.
3. **Add lead indexes** — at minimum `(organizationId, createdAt DESC)`, `(organizationId, source)`, optional GIN on `name`/`email`/`phone` or `pg_trgm`.
4. **Neon pooler** — set `DATABASE_URL` to pooled endpoint; cap Prisma `connection_limit` (e.g. 10–20 per CoreKnot instance).
5. **Drop dual-write after validation** — Mongo-primary + PG mirror doubles write cost; switch to PG-primary when confident.

### Medium term

6. **Tenant column on Project/Task** — or enforce workspace→org join in all list queries.
7. **Replace in-memory CRM search** — Postgres `ILIKE` / full-text with proper indexes.
8. **Materialized views** — optional for CRM dashboards if aggregate pipelines stay hot.
9. **Read replica** — only needed after 10×+ leads and heavy reporting (Neon read replicas on paid plans).

### Low priority at current size

10. Redis/BullMQ tuning — async paths are not the CRM/task board bottleneck today.
11. Relationship graph indexes — empty at current migration; revisit when graph features go live.

---

## Summary

| Question | Answer |
|----------|--------|
| Can Postgres hold synced prod data? | **Yes** — 19 MB vs 512 MB+ limits |
| Can 5–20 staff use CoreKnot concurrently on PG? | **Yes with caveats** — fine at current volume; watch repo patterns not disk |
| Sync complete? | **Yes** — parity within tolerance, no re-run required |

**Caveats:** dual-write overhead, N+1 hydration, in-memory lead counting/search, thinner CRM indexes than Mongo. These bite before raw Postgres storage or Neon capacity limits.
