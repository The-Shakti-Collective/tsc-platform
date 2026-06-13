# Frontend Status Report

**Agent:** Frontend Agent  
**Layer:** Platform  
**Generated:** {{DATE}}

---

## Executive summary

---

## Application matrix

| App | Path | Port | Build | Runtime | Deploy |
|-----|------|------|-------|---------|--------|
| Community | `apps/community/` | 3000 | Pass/Fail | Pass/Fail | Vercel |
| CoreKnot | `apps/coreknot/client/` | 3001 | Pass/Fail | Pass/Fail | Vercel |
| Website | `apps/website/` | 3002 | Partial | Fail | MISSING (org-scaffold) |

---

## Shared frontend packages

| Package | Build | Consumers |
|---------|-------|-----------|
| `@tsc/community-sdk` | | Community |
| `@tsc/ui` | | Future |
| `@tsc/types` | | Community |
| `@tsc/contracts` | | Community |

---

## API connectivity

| App | Env var | Value | CORS OK? |
|-----|---------|-------|----------|
| Community | `NEXT_PUBLIC_API_URL` | | |
| CoreKnot | Vite proxy `/api` | | |

---

## Auth status

| App | Mode | Clerk key | HTTP on routes |
|-----|------|-----------|----------------|
| Community | stub / clerk | | |
| CoreKnot | stub / clerk | `VITE_CLERK_PUBLISHABLE_KEY` | |

---

<!-- Include _master-status-section.md content below -->
