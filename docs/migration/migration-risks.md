# CoreKnot Migration — Risk Register

> **Owner:** Agent 0 · **Last updated:** 2026-06-14  
> Review at each wave boundary. Link blockers to [migration-status.md](./migration-status.md).

---

## Critical risks (P0)

| ID | Risk | Impact | Likelihood | Mitigation | Owner |
|----|------|--------|------------|------------|-------|
| R-001 | **Premature Mongo/Render decommission** | Irreversible data loss; prod outage | Medium if rushed | Hard-gate to Wave 4 only; 72h rollback window; 30-day validation before Atlas archive | Agent 10 |
| R-002 | **Client breakage from path mismatch** | Operators cannot work; revenue impact | High (hybrid client state) | Agent 5 compat layer; Agent 4 full contract matrix; staged rollout | Agent 5 |
| R-003 | **Auth cutover failure** | Mass lockout | Medium | Dual-auth window (JWT + Clerk); forced password reset plan; rollback to legacy auth | Agent 6 |
| R-004 | **Data loss during ETL** | Corrupted tasks, CRM, mail history | Medium | Idempotent scripts; checksum counts; dry-run on local; prod read-only before cutover | Agent 3 |
| R-005 | **Undocumented legacy routes** | Silent 404s post-cutover | High (~40 domains) | Agent 1 exhaustive route catalog; unknown-route monitoring in staging | Agent 1 |

---

## High risks (P1)

| ID | Risk | Impact | Likelihood | Mitigation | Owner |
|----|------|--------|------------|------------|-------|
| R-006 | **Prior single-agent work conflicts with audit** | Rework, merge conflicts, wrong assumptions | High | Active pause directive until Wave 1 complete | Agent 0 |
| R-007 | **Mongo ObjectId → Postgres ID mapping gaps** | Broken foreign keys, orphaned records | High | `sync` mapping table pattern; explicit external_id columns | Agent 3, 8 |
| R-008 | **Response shape drift** | Client parsers fail silently | High | Contract tests (Agent 9); preserve `apiOk`/`apiError` envelope | Agent 5 |
| R-009 | **Background workers not migrated** | Mail queue stall, webhooks drop | Medium | Agent 7 worker parity checklist; BullMQ queue name map | Agent 7 |
| R-010 | **UploadThing → R2 gap** | Broken file uploads | Medium | Keep UploadThing proxy in Wave 2 or defer P2 domains | Agent 7 |
| R-011 | **Multi-tenant / org context loss** | Cross-tenant data leak | Low but catastrophic | Tenant scoping audit in Agent 2; membership-context parity tests | Agent 2, 6 |
| R-012 | **Realtime / WebSocket token path** | Live updates stop | Medium | `/api/auth/realtime-token` compat or client update plan | Agent 4, 5 |

---

## Medium risks (P2)

| ID | Risk | Impact | Likelihood | Mitigation | Owner |
|----|------|--------|------------|------------|-------|
| R-013 | **No Prisma migrations in repo** | Schema drift prod vs code | High | Baseline migration before Wave 2 ETL | Agent 3 |
| R-014 | **Founder secrets missing** | Cannot staging-parity prod | High | FOUNDER-TASKS: Clerk, Neon, Redis prod URLs | Founder |
| R-015 | **Mail tracking URL domain change** | Open/click metrics break | Medium | Preserve tracking base URLs or redirect rules | Agent 7 |
| R-016 | **Gamification / data-hub complexity** | Long tail migration | High | P2 tier; optional legacy proxy for 90 days | Agent 8 |
| R-017 | **Performance regression** | Slow task board, CRM | Medium | p95 budget in Wave 3; index plan from Agent 2 | Agent 9 |
| R-018 | **Build gate failures** | CI blocks merge | Medium | Fix `@tsc/community` CoreKnot imports before Wave 3 | Platform |
| R-019 | **19 unmerged INTEGRATION.patch.md** | Features appear broken in dev | Medium | Agent 4 marks which routes are dev-only vs prod-critical | Agent 4 |

---

## Low risks (P3)

| ID | Risk | Impact | Likelihood | Mitigation | Owner |
|----|------|--------|------------|------------|-------|
| R-020 | **Render doc staleness** | Wrong runbook during incident | Low | Agent 11 updates ENVIRONMENT_GUIDE | Agent 11 |
| R-021 | **Supabase backup worker legacy** | Backup gap post-Mongo | Low | Evaluate retire vs port in Agent 7 | Agent 7 |
| R-022 | **QA / Lighthouse routes** | Internal tooling only | Low | P3 tier; keep on legacy until retired | Agent 8 |

---

## Assumptions (validate in Wave 1)

| ID | Assumption | Validate by |
|----|------------|-------------|
| A-001 | Production traffic still hits Render Express, not Railway NestJS | Agent 1 + infra check |
| A-002 | `taskmaster_production` is sole prod Mongo database | Agent 2 |
| A-003 | Vite client is deployed separately (Vercel); API URL configurable | Agent 4 |
| A-004 | NestJS `workspace/:slug/tasks` is dev-only or partial prod | Agent 1, 4 |
| A-005 | Clerk can map to existing user emails for migration | Agent 6 |

---

## Rollback strategy (Wave 4)

1. **Traffic rollback:** Re-point client API URL to Render within 15 minutes
2. **Data rollback:** Mongo kept read-write capable for 72h post-cutover
3. **Auth rollback:** JWT issuer restored on legacy server if Clerk cutover fails
4. **Communication:** Agent 11 maintains rollback runbook with exact env var values

**Never delete Mongo Atlas cluster or Render service until checklist §Cutover complete.**

---

## Risk review schedule

| When | Action |
|------|--------|
| Wave 1 complete | Re-score R-005, R-006, R-007 with audit data |
| Wave 2 complete | Re-score R-002, R-008, R-009, R-010 |
| Wave 3 complete | Close or accept residual R-017 |
| Wave 4 + 30 days | Close R-001; archive Mongo |
