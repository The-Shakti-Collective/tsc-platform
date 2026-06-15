# Technical Debt Roadmap

> Prioritized from production readiness audit (2026-06-15) + Tech Debt Elimination Program (Agents 01–18).  
> Status key: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low · ✅ Done  
> Cross-ref: [MASTER-TECH-DEBT-ELIMINATION-REPORT.md](../elimination/MASTER-TECH-DEBT-ELIMINATION-REPORT.md) · [MASTER-PRODUCTION-READINESS-REPORT.md](../readiness/MASTER-PRODUCTION-READINESS-REPORT.md)

**Last updated:** 2026-06-15 (agent execution sweep)

---

## Completed ✅ (2026-06-15)

| ID | Item | Commit / evidence |
|----|------|-------------------|
| C6 | RBAC — `/admin`, `/audit`, `/analytics` scoped | [`38e6ea5`](https://github.com/TheShaktiCollective/tsc-platform/commit/38e6ea5) |
| H6 | Render.yaml archived (Railway canonical) | [`af7361f`](https://github.com/TheShaktiCollective/tsc-platform/commit/af7361f) · [DEPLOYMENT-CERTIFICATE.md](../elimination/DEPLOYMENT-CERTIFICATE.md) |
| H7 | `org-scaffold/` DEPRECATED.md stubs | [`af7361f`](https://github.com/TheShaktiCollective/tsc-platform/commit/af7361f) |
| M1 | CI consolidated to single `ci.yml` | [`af7361f`](https://github.com/TheShaktiCollective/tsc-platform/commit/af7361f) · [CI-CD-CERTIFICATE.md](../elimination/CI-CD-CERTIFICATE.md) |
| — | Platform boundary guards (compat prod gate, frontend URL guards) | [`1e1c6fc`](https://github.com/TheShaktiCollective/tsc-platform/commit/1e1c6fc) · [`04bdf7f`](https://github.com/TheShaktiCollective/tsc-platform/commit/04bdf7f) |
| — | CoreKnot P1 `createLegacyRepository` Prisma import fix | [`85678e7`](https://github.com/TheShaktiCollective/tsc-platform/commit/85678e7) |
| — | Task Prisma indexes (`dueAt`, `[workspaceId, status]`) | [`38e6ea5`](https://github.com/TheShaktiCollective/tsc-platform/commit/38e6ea5) |
| — | Documentation hub + elimination certificates | [`c8c642e`](https://github.com/TheShaktiCollective/tsc-platform/commit/c8c642e) · [elimination/README.md](../elimination/README.md) |
| C4 | Clerk webhook → User/Person provisioning | **This sweep** — `POST /api/webhooks/clerk` |
| P0-7 | Website contact → Inquiry/Lead pipeline | **This sweep** — `POST /api/public/inquiries/contact` |
| H4 / P1-1 | Community mock → API (dashboard, opportunities, profile) | **This sweep** — SDK + `NEXT_PUBLIC_USE_MOCK_DATA` dev-only |
| M8 | Health check path consistency | **This sweep** — canonical `/api/health/ready` in start scripts |
| M2 | CoreKnot server in CI | **This sweep** — `test:ci` job (subset; verify on Linux CI) |
| P1-8 | Rate limiting scaffold | **This sweep** — `IpRateLimitGuard` on public routes |
| P1-6 | Platform API PostHog/Sentry init | **This sweep** — `ObservabilityInitService` |
| H3 | E2E smoke health path | **This sweep** — readiness-first + skip when API down |

---

## Agent assignment table (open items)

| ID | Item | Agent | Status |
|----|------|-------|--------|
| C1 | CoreKnot Mongo runtime dependency | **Mongo-Exit** | OPEN — [MONGO-SUNSET-REPORT.md](./MONGO-SUNSET-REPORT.md) P0 ETL → parity → `COREKNOT_*_STORE=postgres` |
| C2 | Prisma migration drift (P3018) on Neon | **Founder** + Platform-API | BLOCKED (Founder) — `prisma migrate resolve` + deploy; see [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) Step 4 |
| C3 | Founder infra incomplete (0/8) | **Founder** | BLOCKED (Founder) — [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) |
| C5 | Railway Platform API not live | **Founder** | BLOCKED (Founder) — [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) Step 4 |
| P0-6 | Platform/CoreKnot dual-write sunset | **Mongo-Exit** | BLOCKED (Mongo) — post Mongo parallel-run |
| P0-8 | CoreKnot client prod deploy (Vercel) | **Founder** | BLOCKED (Founder) — `VITE_API_URL=https://api.coreknot.in/api` |
| P0-9 | P1 Prisma domains (Attendance, Calendar, Mail, Finance) | **Platform-API** | OPEN — incremental per [MONGO-SUNSET-REPORT.md](./MONGO-SUNSET-REPORT.md) |
| P0-10 | Prod `TSC_ADMIN_USER_IDS` | **Founder** | BLOCKED (Founder) — [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) |
| H1 | Platform API CoreKnot modules dual ownership | **Platform-API** | OPEN — sunset `CoreknotCompatModule` post Mongo |
| H2 | CoreKnot JWT vs Platform Clerk | **Auth** | OPEN — CoreKnot Clerk migration [AUTH-CUTOVER-PLAN.md](../elimination/AUTH-CUTOVER-PLAN.md) |
| H3 | E2E suite green (full flows) | **E2E** | PARTIAL — smoke fixed; signup/org/invite/project/task flows still failing |
| H5 | CoreKnot Vercel monorepo install | **DevOps** | OPEN — [TECH-DEBT H5 / P1-10](../elimination/MASTER-TECH-DEBT-ELIMINATION-REPORT.md) |
| H8 | Isolate CoreKnot postinstall from Website/Community Vercel | **DevOps** / **CoreKnot** | PARTIAL — guard in `generateVercelConfig.cjs`; see [DEPLOYMENT-CERTIFICATE.md](../elimination/DEPLOYMENT-CERTIFICATE.md) |
| M3 | Supabase secondary mirror code | **Mongo-Exit** | OPEN — remove after Neon backup confirmed |
| M4 | 100+ CoreKnot Mongo one-off scripts | **Mongo-Exit** | OPEN — archive to `scripts/archive/` |
| M5 | `packages/projects`, `packages/tasks` in Platform monorepo | **Platform-API** | OPEN — [SHARED-PACKAGE-ROADMAP.md](../elimination/SHARED-PACKAGE-ROADMAP.md) |
| M6 | Typesense + R2 scaffolds only | **Founder** | BLOCKED (Founder) — [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) Steps 6–7 |
| M7 | `.specify/MASTER.md` outdated diagram | **Platform-API** | OPEN — point to `docs/architecture/` |
| P1-2 | CoreKnot Clerk auth | **Auth** | OPEN |
| P1-3 | Remove Platform ops modules + compat | **Platform-API** | OPEN — post Mongo |
| P1-4 | E2E full suite | **E2E** | PARTIAL |
| P1-7 | Neon restore drill | **DR** | OPEN — [DISASTER-RECOVERY-CERTIFICATE.md](../readiness/DISASTER-RECOVERY-CERTIFICATE.md) |
| P1-11 | Post/Feed modules beyond stubs | **Community** | OPEN |
| P2+ | Typesense, R2 CDN, Redis rate limits at scale | **Observability** / **Founder** | OPEN / BLOCKED |

---

## Critical 🔴

| ID | Item | Impact | Remediation |
|----|------|--------|-------------|
| C1 | CoreKnot Mongo runtime dependency | Prod blocked on Atlas; dual-stack complexity | [MONGO-SUNSET-REPORT.md](./MONGO-SUNSET-REPORT.md) · Agent **Mongo-Exit** |
| C2 | Prisma migration drift (P3018) | Deploy/migrate fails on Neon | `pnpm prisma migrate resolve --applied <migration>` then `migrate deploy` · **Founder** Neon access |
| C3 | Founder infra incomplete (0/8) | No live prod | [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) |
| C4 | Clerk webhook user provisioning | ✅ Wired `POST /api/webhooks/clerk` | Configure `CLERK_WEBHOOK_SECRET` in prod · [AUTH-CUTOVER-PLAN.md](../elimination/AUTH-CUTOVER-PLAN.md) |
| C5 | Railway Platform API not live | Community/Website can't prod | **Founder** Railway deploy |
| C6 | RBAC gaps — admin/audit/analytics | ✅ Fixed 2026-06-15 | [`38e6ea5`](https://github.com/TheShaktiCollective/tsc-platform/commit/38e6ea5) |

---

## High 🟠

| ID | Item | Impact | Remediation |
|----|------|--------|-------------|
| H1 | Platform API CoreKnot modules dual ownership | Conflicting writes | Sunset after Mongo · [API-BOUNDARY-CERTIFICATE.md](../elimination/API-BOUNDARY-CERTIFICATE.md) |
| H2 | CoreKnot JWT auth vs Platform Clerk | Two identity systems | **Auth** — Clerk on CoreKnot; remove `LegacyJwtService` |
| H3 | E2E failing flows | No merge confidence | **E2E** — smoke ✅; full flows remain |
| H4 | Community mock data | ✅ API wired (dev mock via flag only) | `NEXT_PUBLIC_USE_MOCK_DATA=true` for local demo |
| H5 | CoreKnot Vercel proxy/install | Client deploy fails | **DevOps** + **Founder** |
| H8 | CoreKnot postinstall breaks Website/Community Vercel | Architecture violation — Platform deploys must not require CoreKnot env (`RENDER_API_PROXY_URL`) | **DevOps** / **CoreKnot** — `generateVercelConfig.cjs` no-ops unless `VERCEL_PROJECT_NAME` contains `coreknot`, `COREKNOT_DEPLOY=true`, or CoreKnot build lifecycle; see [DEPLOYMENT-ARCHITECTURE.md](./DEPLOYMENT-ARCHITECTURE.md) · [DEPLOYMENT-CERTIFICATE.md](../elimination/DEPLOYMENT-CERTIFICATE.md) |
| H6 | Render.yaml alongside Railway | ✅ Archived | [DEPLOYMENT-CERTIFICATE.md](../elimination/DEPLOYMENT-CERTIFICATE.md) |
| H7 | `org-scaffold/` deprecated templates | ✅ DEPRECATED.md | Full archive on repo extraction |

---

## Medium 🟡

| ID | Item | Impact | Remediation |
|----|------|--------|-------------|
| M1 | Split CI workflows | ✅ Consolidated | [CI-CD-CERTIFICATE.md](../elimination/CI-CD-CERTIFICATE.md) |
| M2 | CoreKnot server not in main CI | ✅ `test:ci` job added | Verify on GitHub Actions (Linux) |
| M3 | Supabase secondary mirror | Dead paths | **Mongo-Exit** |
| M4 | CoreKnot Mongo one-off scripts | Repo noise | **Mongo-Exit** — `scripts/archive/` |
| M5 | packages/projects, packages/tasks in Platform | Boundary blur | **Platform-API** |
| M6 | Typesense + R2 scaffolds | Search/media gaps | **Founder** FOUNDER-TASKS 6–7 |
| M7 | `.specify/MASTER.md` diagram | Agent confusion | **Platform-API** |
| M8 | Health check path inconsistency | ✅ Canonical `/api/health/ready` | Legacy `/api/feed/health` preserved |

---

## Low 🟢

| ID | Item | Agent | Remediation |
|----|------|-------|-------------|
| L1 | Lint debt in CI | Platform-API | Incremental fix |
| L2 | `pnpm audit` findings | DevOps | Scheduled updates |
| L3 | BetterStack heartbeat scaffold | Observability | **Founder** monitoring step |
| L4 | Duplicate env documentation | Platform-API | ENVIRONMENT_GUIDE → ENV-STANDARD |
| L5 | Website `.next` git noise | DevOps | gitignore verify |

---

## P0 blockers remaining (10 → 6 code-complete)

| P0 ID | Item | Status after sweep |
|-------|------|-------------------|
| P0-1 | CoreKnot Mongo exit | OPEN — **Mongo-Exit** |
| P0-2 | Founder infra | BLOCKED — **Founder** |
| P0-3 | Neon P3018 | BLOCKED — **Founder** + Platform-API |
| P0-4 | Clerk webhooks | ✅ DONE (code) — needs prod secret |
| P0-5 | Disable AUTH_STUB + JWT bridge in prod | OPEN — **DevOps** env |
| P0-6 | Dual-write sunset | BLOCKED — Mongo |
| P0-7 | Website → Inquiry | ✅ DONE |
| P0-8 | CoreKnot Vercel deploy | BLOCKED — **Founder** |
| P0-9 | P1 Prisma domains | OPEN — incremental plan |
| P0-10 | TSC_ADMIN_USER_IDS | BLOCKED — **Founder** |

**Remaining P0 count: 6** (4 founder/Mongo-blocked + 2 env/infra execution)

---

## Unused / duplicate code

| Artifact | Classification | Agent |
|----------|----------------|-------|
| `org-scaffold/tsc-api` | ARCHIVE | DevOps |
| `org-scaffold/tsc-community` | ARCHIVE | DevOps |
| `org-scaffold/tsc-web` | ARCHIVE | DevOps |
| `apps/api/src/modules/coreknot-compat/` | REMOVE post cutover | Platform-API |
| `legacy-jwt.service.ts` | REMOVE post CoreKnot Clerk | Auth |
| `apps/coreknot/server/services/supabase/*` | ARCHIVE | Mongo-Exit |
| Platform API Finance/Invoices ops modules | REMOVE from Platform | Platform-API |

---

## Temp migration code

| Path | Remove when | Agent |
|------|-------------|-------|
| `scripts/migrations/coreknot/` | Mongo deprovisioned | Mongo-Exit |
| `CkLegacy*` Prisma models | Postgres stable 90d | Mongo-Exit |
| `COREKNOT_JWT_BRIDGE` | CoreKnot Clerk live | Auth |
| `createLegacyRepository.js` | All repos Prisma | Mongo-Exit |

---

## Quarterly milestones

| Quarter | Goal |
|---------|------|
| Q2 2026 | Founder infra live; P0 Postgres domains on staging |
| Q3 2026 | Mongo parallel-run complete; CoreKnot Clerk |
| Q4 2026 | Mongo deprovisioned; CoreKnot extracted to `tsc-coreknot` repo |
| Q1 2027 | `@tsc/shared` published; deprecated repos archived |

---

## Tracking

Update this doc when items close. Agent reports in `.agents/reports/` are **not canonical** — this file + [MASTER-PRODUCTION-ARCHITECTURE.md](./MASTER-PRODUCTION-ARCHITECTURE.md) are.
