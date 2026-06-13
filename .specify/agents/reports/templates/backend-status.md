# Backend Status Report

**Agent:** Backend Agent  
**Layer:** Platform  
**Generated:** {{DATE}}

---

## Executive summary

---

## Build & typecheck

| Check | Command | Result |
|-------|---------|--------|
| SWC build | `pnpm --filter @tsc/api build` | |
| Typecheck | `pnpm --filter @tsc/api typecheck` | <!-- error count --> |

---

## Runtime

| Check | Result | Evidence |
|-------|--------|----------|
| API boot | | ProfileModule circular dep? |
| Port :4000 | | Single listener |
| Health `/api/feed/health` | | |
| Readiness `/api/health/ready` | | |

---

## Module health (sample)

| Module cluster | Registered | Stub? | Notes |
|----------------|------------|-------|-------|
| identity, profile | | | |
| feed, post, community | | | |
| graph, search | | | |
| intelligence, agents | | | |
| workspace, project, task | | | |

---

## Queue system (BullMQ)

| Mode | REDIS_URL | QueueRegistry | Status |
|------|-----------|---------------|--------|
| Local | set / empty | | stub vs live |

---

## Workspace dependencies

| Package | Build | Used by API |
|---------|-------|-------------|
| `@tsc/database` | | ✅ |
| `@tsc/contracts` | | ✅ |
| `@tsc/permissions` | | ✅ |

---

<!-- Include _master-status-section.md content below -->
