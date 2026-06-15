# Migration counts — after execute

**Date:** 2026-06-14  
**Agent:** L2 — ETL Validation  
**Environment:** Local `DATABASE_URL` (Neon dev)  
**Command:** `pnpm migrate:coreknot:p0:execute` (exit 0, ~26 min)

---

## Execute summary

| Step | Mongo extracted | Postgres created | Notes |
|------|----------------:|-----------------:|-------|
| organizations | 2 | 2 | — |
| users | 16 | 16 users, 16 persons, 16 members | — |
| artists | 4 | 4 | — |
| leads | 2029 | 2029 | — |
| projects | 34 | 34 projects, 9 workspaces | + label-derived workspaces |
| tasks | 373 | 371 | 2 tasks not loaded (investigate) |
| inquiries | 0 | 0 | — |
| gigs | 0 | 0 | — |

---

## Postgres counts (post-execute)

| Entity | Prisma model | Count | Mongo source | Mongo count |
|--------|--------------|------:|--------------|------------:|
| Organizations | `Organization` | 3 | `tenants` | 2 |
| Users | `User` | 19 | `users` | 16 |
| Persons | `Person` | 21 | — | — |
| Artists | `Artist` | 4 | `artists` | 4 |
| Projects | `Project` | 34 | `projects` | 34 |
| Tasks | `Task` | 371 | `tasks` | 373 |
| Invoices | `Invoice` | 0 | `financedocuments` | 257 |
| Contracts | `Contract` | 0 | `artistcontracts` | 0 |
| Workspaces | `Workspace` | 14 | `workspaces` | 8 |
| Leads | `Lead` | 2029 | `leads` | 2029 |
| **Sync mappings** | **`SyncMapping`** | **2481** | — | — |

**Organization / User totals** include pre-existing seed rows (1 org, 3 users before execute).

---

## SyncMapping breakdown

| `tscEntityType` | Count |
|-----------------|------:|
| Lead | 2029 |
| Task | 371 |
| Project | 34 |
| Person | 16 |
| User | 16 |
| Workspace | 9 |
| Artist | 4 |
| Organization | 2 |
| **Total** | **2481** |

Verified: `SELECT COUNT(*) FROM "SyncMapping"` → **2481** (> 0).

---

## Parity notes

| Check | Status |
|-------|--------|
| Artists Mongo ↔ PG | ✅ 4 = 4 |
| Projects Mongo ↔ PG | ✅ 34 = 34 |
| Leads Mongo ↔ PG | ✅ 2029 = 2029 |
| Tasks Mongo ↔ PG | ⚠️ 373 vs 371 (−2) |
| Organizations | ⚠️ 2 migrated + 1 pre-seed = 3 total |
| Invoices / contracts | ⬜ Not in P0 ETL |

See [migration-counts-before.md](./migration-counts-before.md) for pre-execute baseline.
