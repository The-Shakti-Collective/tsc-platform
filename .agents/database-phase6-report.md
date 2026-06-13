# Database Phase 6 Report — Relationship Graph Engine

**Agent:** Implementer-Database/API  
**Date:** 2026-06-12  
**Status:** Complete (partial workspace)

## Summary

Phase 6 Deliverable 1 landed: typed `Relationship` graph engine with CRUD API, subgraph traversal, path finding helpers, and Network View-ready grouped graph payload. Additive on Phase 4/5 `Relationship` + `EcosystemGraphEdge` patterns.

---

## Schema changes (`packages/database/prisma/schema.prisma`)

### New / extended enum `RelationshipType`

`MANAGES`, `COLLABORATED_WITH`, `ATTENDED`, `MEMBER_OF`, `PERFORMED_AT`, `BOOKED_BY`, `FOLLOWS`, `MENTORED_BY`, `SPONSORED_BY`, `WORKED_WITH`, `REFERRED_BY`

### Extended `Relationship` model

| Field | Type | Notes |
|-------|------|-------|
| `weight` | `Float?` | Optional edge weight (alongside existing `strength`) |
| `metadata` | `Json` | Default `{}` |
| `effectiveFrom` | `DateTime?` | Relationship start |
| `effectiveTo` | `DateTime?` | Relationship end |
| `relationshipType` | `RelationshipType` | Typed enum (Phase 6) |

Indexes: entity endpoints, type, effective dates. Unique constraint on `(source, target, type)`.

### `GraphEntityType` enum

Added `Community` for membership edges.

---

## `@tsc/database` helpers (`src/relationship.ts`)

- `RELATIONSHIP_TYPES`, `LEGACY_RELATIONSHIP_TYPE_MAP`
- `relationshipInclude`, `whereEntityTouches`, `whereActiveAt`, `buildRelationshipListWhere`
- `toEcosystemGraphEdge`, `buildEntitySubgraph`, `groupConnectedByRelationshipType`
- `findPathsInMemory` (BFS, configurable depth)
- `toRelationshipCreateInput`, create/update data types

Re-exported via `src/index.ts`; `intelligence.ts` re-exports graph edge mapper for Phase 5 compatibility.

---

## `@tsc/types` / `@tsc/contracts`

- `packages/types/src/relationship.ts` — `RelationshipRecord`, `EntitySubgraphResponse`, `EcosystemGraphEdge`
- `packages/contracts/src/relationship/schemas.ts` — Zod create/update/list/graph schemas + legacy type normalization
- `packages/contracts/src/industry/enums.ts` — updated `RelationshipTypeSchema` to Phase 6 values

---

## `@tsc/api` module (`apps/api/src/modules/relationship/`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/relationships/types` | List supported relationship types |
| GET | `/relationships/graph/:entityType/:entityId` | Entity subgraph grouped by type |
| GET | `/relationships` | List/filter relationships |
| GET | `/relationships/:id` | Fetch one |
| POST | `/relationships` | Create |
| PATCH | `/relationships/:id` | Update metadata/dates/strength |
| DELETE | `/relationships/:id` | Delete |

Uses `StubAuthGuard`, `parseSchema`, Zod contracts. Graph query returns `byRelationshipType` buckets for Network View UI.

Also added minimal `apps/api/src/common/*` stubs (Prisma, auth, validation) required by module imports in this partial workspace.

---

## Blocked by missing monorepo files

| Missing | Impact |
|---------|--------|
| Full 53-model `schema.prisma` | Local file is Relationship-only snapshot — merge into canonical schema before migrate |
| Root `package.json` / pnpm workspace | Cannot run workspace build here |
| `apps/api/package.json`, `main.ts`, other modules | API boot not verified end-to-end |
| `@tsc/analytics` graph helpers | Intelligence module still references `summarizeEntityGraph` (unchanged — out of scope) |
| DB migration execution | `prisma migrate` not run |

---

## Migration path

```bash
export DATABASE_URL="postgresql://USER:PASS@HOST:5432/DATABASE"
# Merge Relationship block into canonical schema, then:
npx pnpm --filter @tsc/database prisma:validate
npx prisma migrate dev --name phase6_relationship_graph_engine
```

Legacy Phase 4 snake_case types accepted at API/contracts layer via `RelationshipTypeInputSchema` transform.

---

## Next steps — Network View UI agent

1. Point CoreKnot client at `GET /relationships/graph/:entityType/:entityId?depth=2`
2. Render `nodes` + `edges` in React Flow from `EntitySubgraphResponse`
3. Use `byRelationshipType` for cluster tabs / filters (fans, venues, collaborators, etc.)
4. Wire create/update flows to `POST/PATCH /relationships` when user draws or edits edges
5. Keep `GET /intelligence/ecosystem/:entityType/:entityId/graph` for analytics cluster summary until UI migrates

---

## Files created/changed

**Created**

- `packages/database/**` (package scaffold, schema, `relationship.ts`, `intelligence.ts`, `index.ts`)
- `packages/types/**` (relationship types)
- `packages/contracts/**` (relationship + industry enum schemas)
- `packages/permissions/**` (minimal stub for auth guard)
- `apps/api/src/common/**` (Prisma, auth, validation, ids, json)
- `apps/api/src/modules/relationship/**` (module, controller, service, repository, dto, types)
- `.agents/database-phase6-report.md`

**Changed**

- `apps/api/src/app.module.ts` — register `RelationshipModule`
