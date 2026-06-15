# Agent Continuity Memory

> Last updated: 2026-06-15  
> Entry point: [AGENTS.md](../AGENTS.md) · **Architecture:** [docs/architecture/MASTER-PRODUCTION-ARCHITECTURE.md](../docs/architecture/MASTER-PRODUCTION-ARCHITECTURE.md)

## Architecture authority (2026-06-15)

Production architecture documented in `docs/architecture/` (14 domain docs + master). Key facts:

- **Two APIs:** Platform (`apps/api`, Railway) · CoreKnot (`apps/coreknot/server`, Railway)
- **Two frontends per product:** Vercel for Website, Community, CoreKnot client
- **One Postgres (Neon), one Redis, Clerk target IdP**
- **Mongo:** CoreKnot server only — sunset in progress; Platform API clean
- **Repos target:** tsc-platform, tsc-coreknot, tsc-shared, tsc-infra, tsc-docs

## Current gate

Production **NOT READY** (readiness audit 2026-06-15, Agents 15–25). Verdict: 0/15 pass criteria met. **Tech Debt Elimination Program (Agents 01–18, Workers A–D) completed 2026-06-15** — partial success: Platform API boundaries gated in prod, C6 admin/audit/analytics RBAC fixed, CI consolidated, Render archived, 17 elimination certificates published. Master synthesis: [docs/elimination/MASTER-TECH-DEBT-ELIMINATION-REPORT.md](../docs/elimination/MASTER-TECH-DEBT-ELIMINATION-REPORT.md). Remaining P0 blockers: CoreKnot Mongo runtime, founder infra 0/8, Clerk webhooks, Neon P3018, dual-write sunset, Community mock UI, Website→CRM workflow.

## Do not redo

Platform API R0 scaffolding (health, Swagger, ClerkAuthGuard, CI, Railway config). Architecture docs in `docs/architecture/`.

## Top P0 blockers

1. CoreKnot Mongo runtime (~85 Mongoose models)
2. Prisma migration drift (P3018 on Neon)
3. Founder infra (Clerk, DNS, Railway, Vercel)
4. Clerk webhook user provisioning
5. ~~RBAC gaps on admin/audit/analytics~~ ✅ closed Agent 14 (C6)
6. E2E 5/8 failing
7. Platform API CoreKnot module duplication (compat layer)
8. CoreKnot JWT vs Clerk dual auth

Detail: [docs/architecture/TECH-DEBT-ROADMAP.md](../docs/architecture/TECH-DEBT-ROADMAP.md)

## After founder cutover

1. CoreKnot Postgres P0 domain flags in prod
2. Mongo parallel-run → deprovision Atlas
3. Clerk on CoreKnot staff
4. Extract `tsc-coreknot` repo
5. P1 agents 06–07 (Community API wiring, placeholder elimination)

Registry: [execution-agents.md](../.specify/agents/execution/execution-agents.md)
