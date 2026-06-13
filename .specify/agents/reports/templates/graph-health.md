# Graph Health Report

**Agent:** Graph Agent  
**Layer:** Platform  
**Generated:** {{DATE}}

---

## Executive summary

---

## Core relationship types

| Type | Defined in | API usage | Edge count trend |
|------|------------|-----------|------------------|
| MEMBER_OF | `packages/database/src/relationship.ts` | community, graph | |
| ATTENDED | `packages/database/src/participation.ts` | event, fan | |
| COLLABORATED_WITH | `packages/database/src/collaboration.ts` | relationship | |
| FOLLOWS | `packages/database/src/follow.ts` | fan, feed | |

---

## Integrity checks

| Check | Result | Count |
|-------|--------|-------|
| Orphaned edges (missing source) | | |
| Orphaned edges (missing target) | | |
| Invalid relationship type | | |
| Duplicate edges | | |

---

## Package & module health

| Component | Build | Status |
|-----------|-------|--------|
| `@tsc/graph` | | |
| `apps/api/src/modules/graph/` | | |
| Graph BullMQ workers | | |

---

## Graph growth

| Metric | Current | Previous sweep | Delta |
|--------|---------|----------------|-------|
| Total relationships | | | |
| Nodes by entity type | | | |

---

<!-- Include _master-status-section.md content below -->
