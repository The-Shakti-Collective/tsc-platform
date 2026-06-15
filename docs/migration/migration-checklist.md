# CoreKnot Migration — Success Checklist

> **Purpose:** Final success criteria before Wave 4 cutover and Mongo/Render removal.  
> **Rule:** Every item must be ✅ before Agent 10 decommissions legacy infrastructure.

---

## 1. Audit completeness (Wave 1)

- [ ] **1.1** Legacy route catalog covers all 37+ Express domains with method, path, auth tier
- [ ] **1.2** Mongo schema inventory lists every collection in `taskmaster_production` with document counts
- [ ] **1.3** Client contract matrix covers all 42 `*Api.js` modules + direct axios/fetch calls
- [ ] **1.4** Domain map assigns every P0/P1 legacy domain to NestJS module + Prisma model (or explicit "retire/proxy")
- [ ] **1.5** Commander sign-off on Wave 1 deliverables

---

## 2. API compatibility (Wave 2)

- [ ] **2.1** `apps/coreknot/client` works against **target API only** (no legacy Express required for P0 flows)
- [ ] **2.2** Compatibility layer preserves legacy path shapes for all P0 client calls (e.g. `/api/tasks`, `/api/crm/*`, `/api/auth/*`)
- [ ] **2.3** Response envelopes match legacy `apiOk` / `apiError` conventions where client parsers depend on them
- [ ] **2.4** NestJS workspace paths (`/api/workspace/:slug/*`) and legacy paths both function during transition OR client fully unified on one shape
- [ ] **2.5** CORS allows CoreKnot client origin in staging and production
- [ ] **2.6** OpenAPI / Swagger documents migrated surface area at `/api/docs`

---

## 3. Data integrity (Wave 2)

- [ ] **3.1** ETL scripts run idempotently (safe re-run without duplicates)
- [ ] **3.2** Row/document count parity within agreed tolerance for P0 entities (users, tasks, projects, teams, CRM leads)
- [ ] **3.3** Foreign-key relationships resolve (no orphan tasks without projects/users)
- [ ] **3.4** Mongo ObjectId → Postgres ID mapping table populated for all migrated entities
- [ ] **3.5** Dry-run ETL completed against `taskmaster_local` copy; prod dry-run read-only snapshot validated
- [ ] **3.6** Prisma migration baseline committed and applied to staging Postgres

---

## 4. Authentication & authorization (Wave 2)

- [ ] **4.1** Clerk auth works for migrated users (email match or explicit import)
- [ ] **4.2** Role / page-permission parity with legacy `pagePermissions` behavior
- [ ] **4.3** OAuth connect flows (Google, Meta, etc.) documented as migrated, proxied, or retired
- [ ] **4.4** Realtime token endpoint functional or client updated to new auth pattern
- [ ] **4.5** No production user lockout during cutover (rollback tested)

---

## 5. Background jobs & integrations (Wave 2)

- [ ] **5.1** Critical BullMQ workers running on monorepo Redis (mail send, webhooks, notifications)
- [ ] **5.2** Mail campaign send + tracking (opens/clicks) functional on target stack
- [ ] **5.3** Webhook receivers (Exly, Meta, etc.) routed to Railway API
- [ ] **5.4** File upload path decided and working (UploadThing compat or R2 migration)
- [ ] **5.5** Scheduled jobs (stats, log archiver, backup) migrated or explicitly retired with sign-off

---

## 6. Testing & validation (Wave 3)

- [ ] **6.1** Contract test suite: legacy response ≡ adapter for all P0 paths
- [ ] **6.2** Integration tests pass against Postgres seed data
- [ ] **6.3** E2E smoke passes: login → dashboard → task board → project → CRM leads → mail stats
- [ ] **6.4** p95 API latency within 1.5× Render baseline on staging under load sample
- [ ] **6.5** No P0 Sentry errors in 48h staging soak
- [ ] **6.6** `pnpm --filter @tsc/api typecheck` — 0 errors
- [ ] **6.7** `pnpm build` gate passes (including `@tsc/coreknot-client`)

---

## 7. Staging parity

- [ ] **7.1** Staging API deployed on Railway with prod-equivalent env (Neon, Redis, Clerk)
- [ ] **7.2** Staging client points at staging API; internal team dogfoods for ≥ 5 business days
- [ ] **7.3** Side-by-side comparison: 10 representative operator workflows identical outcomes legacy vs target

---

## 8. Cutover (Wave 4)

- [ ] **8.1** Production DNS / env updated: CoreKnot client → Railway API
- [ ] **8.2** Production cutover executed in maintenance window with on-call
- [ ] **8.3** Mongo switched to read-only (writes only via target API)
- [ ] **8.4** 72-hour rollback drill documented and tested
- [ ] **8.5** 30-day production validation period complete with no P0 incidents attributable to migration

---

## 9. Decommission (Wave 4 — ONLY after §1–8 complete)

> ⚠️ **Do not start this section until all items above are checked.**

- [ ] **9.1** Render service `taskmaster-jfw0.onrender.com` scaled to zero / deleted
- [ ] **9.2** MongoDB Atlas `taskmaster_production` cluster archived (backup exported to cold storage)
- [ ] **9.3** Legacy env vars removed from active deployment configs
- [ ] **9.4** `apps/coreknot/server` marked deprecated in docs (retain read-only in repo for reference period)
- [ ] **9.5** Agent 11 runbooks updated: ENVIRONMENT_GUIDE, production-deploy, on-call playbooks

---

## 10. Documentation (Wave 4)

- [ ] **10.1** Migration summary published (what moved, what retired, ID mapping approach)
- [ ] **10.2** Operator FAQ for auth changes
- [ ] **10.3** Developer guide: local dev without legacy Express server
- [ ] **10.4** Audit artifacts archived in `docs/migration/audits/`

---

## Sign-off

| Role | Name | Date | Wave 4 approved |
|------|------|------|-----------------|
| Migration Commander (Agent 0) | | | ☐ |
| Founder / operator | | | ☐ |

**Cutover authorized only when all §1–8 boxes checked and both sign-offs complete.**
