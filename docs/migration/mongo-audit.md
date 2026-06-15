# Mongo audit — CoreKnot legacy (Agent L1)

**Date:** 2026-06-14  
**Scope:** Local read-only audit for ETL P0 — **no production changes**  
**Command:** `node scripts/migrations/coreknot/audit-mongo.mjs`  
**References:** [01-system-audit](./01-system-audit.md) · [02-schema-mapping](./02-schema-mapping.md) · [ETL README](../../scripts/migrations/coreknot/README.md)

---

## Connection

| Field | Value |
|-------|-------|
| **Env source** | `apps/coreknot/server/.env` overrides `MONGODB_URI` / `MONGODB_DIRECT_URI` / `MONGODB_DB`; root `.env` fills other unset keys |
| **Loader** | `scripts/migrations/coreknot/lib/load-migration-env.mjs` (imported by `lib/env.mjs`) |
| **URI pattern** | Direct shard URI — `directConnection=true` (Windows SRV `querySrv ECONNREFUSED` workaround per `apps/coreknot/server/.env.example`) |
| **Database** | `taskmaster_production` |
| **Ping** | OK (2026-06-14) |

Credentials live only in gitignored env files — never commit Atlas user/password.

---

## Database summary

| Metric | Value |
|--------|-------|
| Collections | **98** |
| Total estimated documents | **220,582** |
| Sampled at | 2026-06-14T04:42:38Z |

---

## P0 migration collections (estimated counts)

| Mongo collection | TSC target | Count |
|------------------|------------|------:|
| `tenants` | `Organization` | 2 |
| `users` | `Person` + `User` + `OrganizationMember` | 16 |
| `artists` | `Artist` | 4 |
| `leads` | `Lead` | 2,029 |
| `projects` | `Project` + `Workspace` | 34 |
| `tasks` | `Task` + `TaskAssignee` | 373 |
| `artistinquiries` | `Inquiry` | 0 |
| `artistgigs` | `Gig` | 0 |

**Related (projects loader):** `workspaces` = 8 documents.

---

## P0 collection indexes

### `tenants`

| Index | Key | Unique |
|-------|-----|--------|
| `_id_` | `{ _id: 1 }` | |
| `domain_1` | `{ domain: 1 }` | yes |

### `users`

| Index | Key | Unique |
|-------|-----|--------|
| `_id_` | `{ _id: 1 }` | |
| `email_1` | `{ email: 1 }` | yes |
| `repId_1` | `{ repId: 1 }` | yes |
| `tenantId_1` | `{ tenantId: 1 }` | |
| `departmentId_1` | `{ departmentId: 1 }` | |
| `name_1` | `{ name: 1 }` | |
| `phone_1` | `{ phone: 1 }` | |

### `artists`

| Index | Key | Unique |
|-------|-----|--------|
| `_id_` | `{ _id: 1 }` | |
| `slug_1` | `{ slug: 1 }` | yes |
| `tenantId_1` | `{ tenantId: 1 }` | |

### `leads` (32 indexes)

Notable keys: `rowId` (unique), `tenantId` + compound CRM filters, text on `name/email/phone/remarks`, partial uniques on `tenantId+email` and `tenantId+phone`.

### `projects`

| Index | Key | Unique |
|-------|-----|--------|
| `_id_` | `{ _id: 1 }` | |
| `tenantId_1` | `{ tenantId: 1 }` | |
| `workspace_1` | `{ workspace: 1 }` | |
| `owner_1` | `{ owner: 1 }` | |
| `members_1` | `{ members: 1 }` | |
| `outletId_1_createdAt_-1` | `{ outletId: 1, createdAt: -1 }` | |

### `tasks`

| Index | Key | Unique |
|-------|-----|--------|
| `_id_` | `{ _id: 1 }` | |
| `tenantId_1` | `{ tenantId: 1 }` | |
| `workspace_1` | `{ workspace: 1 }` | |
| `projectId_1_status_1` | `{ projectId: 1, status: 1 }` | |
| `tenantId_1_projectId_1_status_1` | compound | |
| `title_text_description_text` | text | |

### `workspaces`

| Index | Key | Unique |
|-------|-----|--------|
| `_id_` | `{ _id: 1 }` | |
| `name_1` | `{ name: 1 }` | yes |
| `tenantId_1` | `{ tenantId: 1 }` | |

### `artistinquiries` / `artistgigs`

Standard `_id_` plus `artistId`, `tenantId`, status/date compounds (empty collections at audit time).

---

## ETL dry-run validation (V-001)

```powershell
pnpm migrate:coreknot:p0
```

| Step | Extracted | Dry-run |
|------|-----------|---------|
| organizations | 2 | OK |
| users | 16 | OK |
| artists | 4 | OK |
| leads | 2,029 | OK |
| projects | 34 | OK |
| tasks | 373 | OK |
| inquiries | 0 | OK |
| gigs | 0 | OK |

**V-001 env gate:** No `Missing required env: MONGODB_URI` — URI loads from `apps/coreknot/server/.env` (overrides root). Verified `pnpm migrate:coreknot:p0` exit 0 on 2026-06-14.
---

## Env wiring (for agents)

1. Set `MONGODB_URI` in `apps/coreknot/server/.env` (founder Atlas URI).
2. Optional: mirror to repo root `.env` for other scripts (server file overrides Mongo keys).
3. Windows: prefer direct shard URI over `mongodb+srv://` (see `.env.example` comments).
4. Optional `MONGODB_DIRECT_URI` — `env.mjs` swaps when primary is SRV.
5. Default `MONGODB_DB` = `taskmaster_production` if unset.

---

## Changelog

| Date | Event |
|------|-------|
| 2026-06-14 | Agent L1 — connection audit, P0 counts/indexes, V-001 env unblock verified |
