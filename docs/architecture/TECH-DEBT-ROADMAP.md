# Technical Debt Roadmap

> Prioritized from production readiness audit (2026-06-15) + architecture review.  
> Status key: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

## Critical 🔴

| ID | Item | Impact | Remediation |
|----|------|--------|-------------|
| C1 | CoreKnot Mongo runtime dependency | Prod blocked on Atlas; dual-stack complexity | [MONGO-SUNSET-REPORT.md](./MONGO-SUNSET-REPORT.md) P0→P2 cutover |
| C2 | Prisma migration drift (P3018) | Deploy/migrate fails on Neon | `prisma migrate resolve` after parity; founder Neon access |
| C3 | Founder infra incomplete (0/8 FOUNDER-TASKS) | No live prod | [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) |
| C4 | No Clerk webhook user provisioning | Signup doesn't create DB rows | Wire webhook → Platform API → `User`/`Person` |
| C5 | Railway Platform API not live | Community/Website can't prod | Founder Railway deploy |
| C6 | RBAC gaps — `/admin`, `/audit`, `/analytics` | Data leak risk | Scope guards + org checks |

## High 🟠

| ID | Item | Impact | Remediation |
|----|------|--------|-------------|
| H1 | Platform API CoreKnot modules dual ownership | Conflicting writes | Sunset `CoreknotCompatModule`; CoreKnot API authoritative |
| H2 | CoreKnot JWT auth vs Platform Clerk | Two identity systems | Clerk for staff; remove `LegacyJwtService` |
| H3 | E2E 5/8 failing | No merge confidence | Fix signup, org, invite, project, task flows |
| H4 | Community mock data + feed stub | Not product-ready | Wire to Platform API |
| H5 | CoreKnot Vercel proxy/install broken | Client deploy fails | Fix monorepo install path in Vercel |
| H6 | Render.yaml alongside Railway | Deploy ambiguity | ✅ Archived — [elimination/DEPLOYMENT-CERTIFICATE.md](../elimination/DEPLOYMENT-CERTIFICATE.md) |
| H7 | `org-scaffold/` deprecated repo templates | Confusion | ✅ DEPRECATED.md stubs — full archive on extraction |

## Medium 🟡

| ID | Item | Impact | Remediation |
|----|------|--------|-------------|
| M1 | Split CI workflows (lint/typecheck/test/build) | Maintenance | ✅ Consolidated to `ci.yml` — [elimination/CI-CD-CERTIFICATE.md](../elimination/CI-CD-CERTIFICATE.md) |
| M2 | CoreKnot server not in main CI build | Regressions slip | Add server test job |
| M3 | Supabase secondary mirror code | Dead paths | Remove after Neon backup confirmed |
| M4 | 100+ CoreKnot one-off Mongo scripts | Repo noise | Move to `scripts/archive/` |
| M5 | packages/projects, packages/tasks in Platform monorepo | Boundary blur | Move to CoreKnot or mark deprecated |
| M6 | Typesense + R2 scaffolds only | Search/media gaps | Founder FOUNDER-TASKS 6–7 |
| M7 | `.specify/MASTER.md` outdated diagram | Agent confusion | Point to `docs/architecture/` |
| M8 | Health check path inconsistency | FOUNDER-TASKS says `/api/feed/health` | Canonical: `/api/health/ready` |

## Low 🟢

| ID | Item | Impact | Remediation |
|----|------|--------|-------------|
| L1 | Lint debt in CI | Warnings | Incremental fix |
| L2 | `pnpm audit` findings | Security | Scheduled dependency updates |
| L3 | BetterStack heartbeat scaffold only | No uptime alerts | Scaffold + README — founder monitoring step |
| L4 | Duplicate env documentation | Drift | ENVIRONMENT_GUIDE → points to ENV-STANDARD |
| L5 | Website `.next` in git status noise | Local only | gitignore verify |

## Unused / duplicate code

| Artifact | Classification |
|----------|----------------|
| `org-scaffold/tsc-api` | ARCHIVE — use `apps/api` |
| `org-scaffold/tsc-community` | ARCHIVE |
| `org-scaffold/tsc-web` | ARCHIVE |
| `apps/api/src/modules/coreknot-compat/` | REMOVE after cutover |
| `legacy-jwt.service.ts` | REMOVE after Clerk on CoreKnot |
| `apps/coreknot/server/services/supabase/*` | ARCHIVE |
| Platform API `FinanceModule`, `InvoicesModule` (ops) | REMOVE from Platform |

## Temp migration code

| Path | Remove when |
|------|-------------|
| `scripts/migrations/coreknot/` | Mongo deprovisioned |
| `CkLegacy*` Prisma models | All stores postgres + 90-day stable |
| `COREKNOT_JWT_BRIDGE` | CoreKnot Clerk live |
| `createLegacyRepository.js` | All repos Prisma |

## Quarterly milestones

| Quarter | Goal |
|---------|------|
| Q2 2026 | Founder infra live; P0 Postgres domains on staging |
| Q3 2026 | Mongo parallel-run complete; CoreKnot Clerk |
| Q4 2026 | Mongo deprovisioned; CoreKnot extracted to `tsc-coreknot` repo |
| Q1 2027 | `@tsc/shared` published; deprecated repos archived |

## Tracking

Update this doc when items close. Agent reports in `.agents/reports/` are **not canonical** — this file + [MASTER-PRODUCTION-ARCHITECTURE.md](./MASTER-PRODUCTION-ARCHITECTURE.md) are.
