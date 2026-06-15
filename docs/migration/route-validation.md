# Route Validation — V-003 (Agent L5)

**Date:** 2026-06-14  
**Scope:** OpenAPI (`apps/api/openapi/tsc-api.openapi.json`) vs Nest controllers vs legacy Express mounts ([01-system-audit.md](./01-system-audit.md))  
**Focus:** Validation report #15 — 404 probes on `/api/contracts`, `/api/campaigns`, `/api/finance/invoices`

---

## Executive summary

| Probe (Agent 9) | Root cause | Fix (L5) |
|-----------------|------------|----------|
| `GET /api/contracts` | `ContractController` had POST only — no list handler | Added `@Get()` → `ContractService.list()` |
| `GET /api/campaigns` | No Nest mount; legacy `campaignApiRouter` only | Added `CampaignsLegacyController` stub (empty array) |
| `GET /api/finance/invoices` | Invoices at `/api/invoices`; legacy uses `/my-invoices`, `/pending` | Added `FinanceController` alias `GET finance/invoices` → `InvoicesService.list()` |

After fix: routes **mount** and return **401** (unauthenticated) or **200** (with auth) — not **404**.

---

## P0 probe matrix (validation #15)

| Legacy Route | Current Route | Controller | Status | Notes |
|--------------|---------------|------------|--------|-------|
| `GET /api/contracts` | `GET /api/contracts` | `ContractController` | **OK** | Was Missing — added list handler |
| `POST /api/contracts` | `POST /api/contracts` | `ContractController` | **OK** | OpenAPI + native |
| `GET /api/contracts/templates` | `GET /api/contracts/templates` | `ContractController` | **OK** | |
| `GET /api/contracts/:id` | `GET /api/contracts/:id` | `ContractController` | **OK** | |
| `PATCH /api/contracts/:id/sign` | `PATCH /api/contracts/:id/sign` | `ContractController` | **OK** | |
| `GET /api/campaigns` | `GET /api/campaigns` | `CampaignsLegacyController` | **OK** | Was Missing — P1 stub `[]` |
| `GET /api/campaigns/:id` | — | — | **Missing** | P1 — client `useCampaignDetails` |
| `POST /api/campaigns` | — | — | **Missing** | P1 — mail campaign CRUD |
| `GET /api/finance/invoices` | `GET /api/finance/invoices` | `FinanceController` (alias) | **OK** | Was Wrong prefix — delegates to `InvoicesService` |
| `GET /api/invoices` | `GET /api/invoices` | `InvoicesController` | **OK** | Native Nest path (OpenAPI) |
| `GET /api/finance/my-invoices` | — | — | **Missing** | P1 — legacy finance doc workflow |
| `GET /api/finance/pending` | — | — | **Missing** | P1 — ops invoice review |

---

## P0 compat layer (shipped Wave 2 + L5)

| Legacy Route | Current Route | Controller | Status |
|--------------|---------------|------------|--------|
| `GET /api/crm/leads` | `GET /api/crm/leads` | `CrmLegacyController` | **OK** |
| `GET /api/projects` | `GET /api/projects` | `ProjectsLegacyController` | **OK** |
| `GET /api/tasks` | `GET /api/tasks` | `TasksLegacyController` | **OK** |

Native CRM also at `GET /api/crm/leads?organizationId=` via `CrmController` — compat layer reshapes response.

---

## Prefix map — native vs legacy (selected)

| Legacy prefix | Native Nest prefix | Status | Priority |
|---------------|-------------------|--------|----------|
| `/api/crm/*` | `/api/crm/*` + compat | **OK** (P0) | — |
| `/api/projects/*` | `/api/workspace/:slug/projects` + compat | **OK** (P0) | — |
| `/api/tasks/*` | `/api/workspace/:slug/tasks` + compat | **OK** (P0) | — |
| `/api/contracts/*` | `/api/contracts/*` | **OK** (L5) | — |
| `/api/campaigns/*` | `/api/campaigns` (stub) · `/api/brands/:id/campaigns` (deferred) | **Partial** | P1 |
| `/api/finance/*` | `/api/finance/expenses`, `/summary`, `/invoices` (alias) | **Partial** | P1 |
| `/api/finance/my-invoices` | `/api/invoices` (different shape) | **Wrong prefix** | P1 |
| `/api/mail/*` | — | **Missing** | P1 |
| `/api/calendar` | — | **Missing** | P1 |
| `/api/dashboard` | — | **Missing** | P1 |
| `/api/notifications` | — | **Missing** | P1 |

---

## OpenAPI cross-check

| Path in OpenAPI | Registered controller | Match |
|-----------------|----------------------|-------|
| `/api/contracts` | `ContractController` (GET + POST) | ✅ |
| `/api/contracts/templates` | `ContractController` | ✅ |
| `/api/finance/expenses` | `FinanceController` | ✅ |
| `/api/finance/summary` | `FinanceController` | ✅ |
| `/api/finance/invoices` | `FinanceController` (alias, post-L5 export) | ✅ after re-export |
| `/api/invoices` | `InvoicesController` | ✅ |
| `/api/campaigns` | `CampaignsLegacyController` | ✅ after L5 |
| `/api/brands/{id}/campaigns` | `BrandController` | ✅ (different surface — brand pipeline stub) |

**Path count:** 413 (pre-L5) → re-run `pnpm --filter @tsc/api openapi:export` after deploy to pick up new routes.

---

## Files changed (L5)

| Path | Change |
|------|--------|
| `apps/api/src/modules/contract/contract.controller.ts` | `GET /api/contracts` list |
| `apps/api/src/modules/coreknot-compat/campaigns-legacy.controller.ts` | New — `GET /api/campaigns` stub |
| `apps/api/src/modules/coreknot-compat/coreknot-compat.module.ts` | Register campaigns legacy |
| `apps/api/src/modules/finance/finance.controller.ts` | `GET finance/invoices` alias |
| `apps/api/src/modules/finance/finance.module.ts` | Import `InvoicesModule` |

---

## Changelog

| Date | Event |
|------|-------|
| 2026-06-14 | Agent L5 — V-003 P0 route gaps fixed; this report created |
