# Database Certification (Agent 08)

> **Date:** 2026-06-15  
> **Schema:** `packages/database/prisma/schema.prisma` (~3279 lines)  
> **Constitution:** [../architecture/DATA-OWNERSHIP-MAP.md](../architecture/DATA-OWNERSHIP-MAP.md)

## Before state

| Area | Finding |
|------|---------|
| **Relationships** | FK relations present on all domain models audited; cascades appropriate (`Cascade` on org-owned rows, `SetNull` on optional refs) |
| **Uniques** | Composite uniques on join tables (`ProjectMember`, `OrganizationMember`, `SyncMapping`) |
| **Indexes** | 244 `@@index` entries; most FK columns indexed |
| **Gaps** | `Task.dueAt` unindexed (calendar/due queries); no composite `[workspaceId, status]` for task boards |
| **Orphans** | `CkLegacy*` tables — migration bridge only; not orphans |
| **Migration drift** | P3018 on Neon (C2 in TECH-DEBT-ROADMAP) — **not fixed this wave** |
| **Dual ownership** | Platform + CoreKnot can write same Prisma tables — documented in DATA-OWNERSHIP-MAP |

## After state

| Change | File | Risk |
|--------|------|------|
| Added `@@index([dueAt])` on `Task` | `schema.prisma` | Low — read-only perf |
| Added `@@index([workspaceId, status])` on `Task` | `schema.prisma` | Low — filtered list queries |

### Ownership certification (sample)

| Model | Owner | Cascade | Index coverage |
|-------|-------|---------|----------------|
| `User` | Platform | `personId` → Cascade | `clerkUserId` unique, `platformRole` |
| `OrganizationMember` | Platform | org/person Cascade | `[personId, status]`, `[organizationId, role]` |
| `Lead`, `Inquiry`, `Gig` | CoreKnot | org Cascade | org-scoped composites |
| `Project`, `Task` | CoreKnot | workspace Cascade | workspace + status |
| `AuditLog` | Shared | org SetNull | org+createdAt, entity, actor |
| `AnalyticsMetricSnapshot` | CoreKnot | org SetNull | metricKey+period, org+metricKey |
| `SyncMapping` | Platform sync | — | source+external unique, entity lookup |

### Models with adequate indexing (no change)

- `Relationship` — source/target/type composites
- `AuditLog` — org timeline, entity lookup
- `Lead` / `Inquiry` — org+stage/status
- `AnalyticsMetricSnapshot` — org+metricKey

### Deferred (needs migration + parity run)

| Item | Reason |
|------|--------|
| Neon P3018 resolve | Founder DB access required |
| Drop `CkLegacy*` models | 90-day stable Postgres + Clerk cutover |
| Add `OrganizationMember.status` partial index | Needs query plan validation |
| Workspace isolation FK on all ops tables | Schema already has `organizationId` on CRM/finance rows |

## Risk

| Risk | Mitigation |
|------|------------|
| New indexes on large `Task` table | `CREATE INDEX CONCURRENTLY` via `prisma migrate`; dev-only until deploy |
| Schema push on prod | **Never** — use `prisma migrate deploy` only |

## Rollback

```sql
DROP INDEX IF EXISTS "Task_dueAt_idx";
DROP INDEX IF EXISTS "Task_workspaceId_status_idx";
```

Or revert migration file and `prisma migrate deploy`.

## Certification

| Check | Status |
|-------|--------|
| FK integrity defined | ✅ PASS |
| Cascade rules sane | ✅ PASS |
| Critical query indexes | ✅ PASS (after Task indexes) |
| Migration deploy ready | ⚠️ CONDITIONAL — pending Neon P3018 |
| Single schema authority | ✅ PASS — `packages/database` canonical |

**Overall:** **CONDITIONAL PASS** — schema sound; production migrate blocked on C2 founder task.
