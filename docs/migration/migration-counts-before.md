# Migration counts — before execute

**Date:** 2026-06-14  
**Agent:** L2 — ETL Validation  
**Environment:** Local `DATABASE_URL` (Neon dev) + Mongo Atlas `taskmaster_production`  
**Command:** `pnpm migrate:coreknot:p0` (dry-run completed exit 0)

---

## Mongo source (Atlas)

| Entity | Mongo collection | Count |
|--------|------------------|------:|
| Organizations | `tenants` | 2 |
| Users | `users` | 16 |
| Artists | `artists` | 4 |
| Projects | `projects` | 34 |
| Tasks | `tasks` | 373 |
| Invoices | `financedocuments` | 257 |
| Contracts | `artistcontracts` | 0 |
| Workspaces (registry) | `workspaces` | 8 |

P0 ETL also migrates: `leads` (2029), `artistinquiries` (0), `artistgigs` (0).

---

## Postgres target (pre-execute)

| Entity | Prisma model | Count |
|--------|--------------|------:|
| Organizations | `Organization` | 1 |
| Users | `User` | 3 |
| Persons | `Person` | 5 |
| Artists | `Artist` | 0 |
| Projects | `Project` | 0 |
| Tasks | `Task` | 0 |
| Invoices | `Invoice` | 0 |
| Contracts | `Contract` | 0 |
| Sync mappings | `SyncMapping` | 0 |

---

## P0 dry-run summary (would create)

| Step | Extracted | Dry-run stats |
|------|----------:|---------------|
| organizations | 2 | created 0, skipped 0 |
| users | 16 | created 16 |
| artists | 4 | created 0 |
| leads | 2029 | created 0 |
| projects | 34 | workspaces 0, projects 0 |
| tasks | 373 | created 0 |
| inquiries | 0 | — |
| gigs | 0 | — |

**Note:** Invoices and contracts are **not in P0 scope**; counts listed for parity tracking only.
