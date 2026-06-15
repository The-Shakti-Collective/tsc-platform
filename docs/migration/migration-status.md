# CoreKnot Migration — Live Status

> **Updated:** 2026-06-14 by Agent 0 · Auto-update at wave boundaries

## Overall

| Field | Value |
|-------|-------|
| **Phase** | Wave 4 — Cutover ready |
| **Wave status** | **Code complete** — postgres-primary + P1 ETL + Mongo optional |
| **Commander** | Agent 0 |
| **Legacy prod** | Render `taskmaster-jfw0.onrender.com` · Mongo `taskmaster_production` |
| **Target** | Railway API · Postgres · Clerk |
| **Client** | `apps/coreknot/client` — must not break |
| **Decommission** | Wave 4 only — Mongo + Render **not** scheduled yet |

---

## Wave summary

| Wave | Agents | Status | Exit gate |
|------|--------|--------|-----------|
| 0 — Init | 0 | ✅ COMPLETE | Docs scaffold created |
| 1 — Audits | 1, 2, 4, 8 | ✅ COMPLETE | Four audit files in `docs/migration/` |
| 2 — Build | 3, 5, 6, 7 | ✅ COMPLETE | ETL scripts, compat doc, auth bridge, storage plan |
| 3 — Tests | 9 | 🟡 PARTIAL | See `09-validation-report.md` |
| 4 — Cutover | 10, 11 | 🟡 READY | Founder: [FOUNDER-COREKNOT-LAUNCH.md](../FOUNDER-COREKNOT-LAUNCH.md) |

---

## Agent tracker

| Agent | Role | Wave | Status | Owner | Last update | Blockers |
|-------|------|------|--------|-------|-------------|----------|
| **0** | Migration Commander | All | 🟢 ACTIVE | Agent 0 | 2026-06-14 | — |
| **1** | Legacy Route Auditor | 1 | ✅ COMPLETE | Agent 1 | 2026-06-14 | — |
| **2** | Mongo Schema Auditor | 1 | ✅ COMPLETE | Agent 2 | 2026-06-14 | — |
| **3** | Data Migration Engineer | 2 | ✅ COMPLETE | Agent 3 | 2026-06-14 | — |
| **4** | Client Contract Auditor | 1 | ✅ COMPLETE | Agent 4 | 2026-06-14 | — |
| **5** | API Compatibility Engineer | 2 | ✅ COMPLETE | Agent 5 | 2026-06-14 | — |
| **6** | Auth Bridge Engineer | 2 | ✅ COMPLETE | Agent 6 | 2026-06-14 | Clerk keys (founder) |
| **7** | Storage & Integrations Engineer | 2 | ✅ COMPLETE | Agent 7 | 2026-06-14 | Founder R2 keys for prod probe |
| **8** | Target Domain Mapper | 1 | ✅ COMPLETE | Agent 8 | 2026-06-14 | — |
| **9** | Test & Validation Engineer | 3 | 🟡 PARTIAL | Agent 9 | 2026-06-14 | MONGODB_URI, auth harness, ETL execute |
| **10** | Cutover Engineer | 4 | ⬜ NOT_STARTED | — | — | Wave 3 + checklist; **Mongo/Render removal here only** |
| **11** | Documentation Engineer | 4 | ⬜ NOT_STARTED | — | — | Wave 3 exit gate |

### Status legend

| Icon | Meaning |
|------|---------|
| 🟢 ACTIVE | Currently executing |
| 🟡 IN_PROGRESS | Started, deliverables pending |
| ⬜ NOT_STARTED | Waiting on gate |
| ✅ COMPLETE | Deliverables accepted |
| 🔴 BLOCKED | External blocker |

---

## Wave 1 deliverables

| Deliverable | Agent | Path | Status |
|-------------|-------|------|--------|
| Legacy system audit | 1 | `docs/migration/01-system-audit.md` | ✅ Complete (~448 routes, 94 collections, 6 queues) |
| Mongo → Prisma schema mapping | 2 | `docs/migration/02-schema-mapping.md` | ✅ Complete (38 entities, 10 high-risk items) |
| Domain mapping matrix | 4 | `docs/migration/03-domain-mapping.md` | ✅ Complete |
| Integrations audit | 8 | `docs/migration/07-integrations.md` | ✅ Complete (28 integrations: 12 P0, 11 P1, 5 P2) |

---

## Active blockers

| ID | Severity | Blocker | Affects | Mitigation |
|----|----------|---------|---------|------------|
| B-001 | P1 | Prior P1–P5 domain scaffolds ahead of ETL | Wave 2 reconcile | Reconcile Nest modules against `02-schema-mapping.md` + `03-domain-mapping.md` before data load |
| B-002 | P1 | Client hybrid API paths (NestJS + legacy Express) | Agent 4 audit | Document both paths; compat layer in Wave 2 |
| B-003 | P2 | Prisma migrations exist but not applied locally | Agent 3, integration tests | Run `pnpm --filter @tsc/database exec prisma migrate deploy` |
| B-006 | P1 | **P1–P5 domain modules shipped before Wave 1 audits** | Wave 1 mapping accuracy | Reconcile via Agent 4 + 8 against [reports/coreknot-domain-backend-p1-p3.md](../../reports/coreknot-domain-backend-p1-p3.md) and p4-p5 report |
| B-004 | P2 | Clerk prod keys not set | Agent 6, Wave 4 auth cutover | [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) |
| B-005 | P2 | R2 / Typesense scaffold only | Agent 7 scope | Decide Wave 2 vs defer in domain-map |

---

## Pause directive (active)

Until Wave 1 exit gate, **do not merge**:

- New NestJS domain modules for CoreKnot legacy domains
- Client `App.jsx` routing from `INTEGRATION.patch.md` files
- Mongo → Postgres scripts
- Changes to `sync` outbound behavior
- Render or Mongo decommission actions

---

## Changelog

| Date | Event |
|------|-------|
| 2026-06-14 | Agent 0 initialized migration docs; Wave 1 marked IN_PROGRESS |
| 2026-06-14 | Pause directive issued for conflicting prior work |
| 2026-06-14 | P1–P3 domain backend landed (out of sequence) — reconcile in Wave 1/2 |
| 2026-06-14 | Wave 1 audits persisted: Agents 1, 2, 4, 8 COMPLETE; `VITE_TSC_API_URL` fixed to include `/api` suffix |
