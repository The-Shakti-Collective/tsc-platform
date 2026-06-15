# Master Production Architecture

> **Permanent source of truth** for The Shakti Collective platform.  
> Last updated: 2026-06-15 · Owner: Platform architecture  
> Index: [README.md](./README.md)

---

## 1. Mission

Deliver a **5+ year durable** architecture with:

- One shared data and identity stack
- Two clear products (Platform + CoreKnot)
- Two API hosts — zero client ambiguity
- Zero MongoDB runtime (target; in progress)
- Documented repos, deploy paths, and env standards

---

## 2. Products & ownership

| Product | Users | Frontend | API | Owns |
|---------|-------|----------|-----|------|
| **TSC Platform** | Members, public | Website, Community | `api.theshakticollective.in` | Community, Marketplace, Events, Memberships, Rewards, Audience OS, public analytics |
| **CoreKnot** | Staff | CoreKnot Client | `api.coreknot.in` | CRM, Projects, Tasks, Finance, Contracts, Invoicing, Attendance, internal ops |

Detail: [ARCHITECTURE.md](./ARCHITECTURE.md) · [SYSTEM_CONTEXT.md](./SYSTEM_CONTEXT.md)

---

## 3. Repositories

| Repo | Status |
|------|--------|
| `tsc-platform` | **Primary monorepo** — api, website, community, packages |
| `tsc-coreknot` | **Extract target** — currently `apps/coreknot/` |
| `tsc-shared` | Published `@tsc/*` |
| `tsc-infra` | DNS, Railway, Vercel templates |
| `tsc-docs` | OpenAPI, public docs |
| ~~tsc-api~~, ~~tsc-community~~, ~~tsc-web~~ | **Deprecated** |

Detail: [REPOSITORY-GOVERNANCE.md](./REPOSITORY-GOVERNANCE.md) · [MONOREPO-STANDARD.md](./MONOREPO-STANDARD.md)

---

## 4. Runtime topology

```
Website ──────┐
Community ────┼──► api.theshakticollective.in (NestJS, Railway)
              │
CoreKnot Client ──► api.coreknot.in (Express + Workers, Railway)

Both APIs ──► Neon PostgreSQL + Redis + Clerk + PostHog + Sentry
Frontends ──► Vercel
DNS/R2 ─────► Cloudflare
```

Detail: [DEPLOYMENT-ARCHITECTURE.md](./DEPLOYMENT-ARCHITECTURE.md)

---

## 5. Data

- **One Neon PostgreSQL cluster** — `packages/database/prisma/schema.prisma`
- **Shared tables:** User, Person, Identity, Organization, Workspace, Team
- **Platform tables:** Membership, Reward, Event, MarketplaceListing, FanProfile, …
- **CoreKnot tables:** Lead, Project, Task, Contract, Invoice, Gig, Expense, …
- **Legacy:** `CkLegacy*` migration tables; Mongo ~98 collections until sunset

Detail: [DATA-OWNERSHIP-MAP.md](./DATA-OWNERSHIP-MAP.md)

---

## 6. Authentication

| Layer | Target | Current gap |
|-------|--------|-------------|
| Platform apps | Clerk | Stub in dev ✅; webhooks missing 🔴 |
| Platform API | Clerk Bearer | `ClerkAuthGuard` ✅ |
| CoreKnot | Clerk (target) | JWT `JWT_SECRET` 🔴 |
| Bridge | None | `LegacyJwtService` — remove |

Detail: [AUTH-ARCHITECTURE.md](./AUTH-ARCHITECTURE.md)

---

## 7. API boundaries

| Client | Calls | Never calls |
|--------|-------|-------------|
| Website, Community | Platform API | CoreKnot API |
| CoreKnot Client | CoreKnot API | Platform API (direct CRM) |

Cross-service: webhooks (Website→CoreKnot), sync (Platform↔CoreKnot server-to-server only).

Detail: [API-BOUNDARY.md](./API-BOUNDARY.md) · [COREKNOT-BOUNDARY.md](./COREKNOT-BOUNDARY.md)

---

## 8. Mongo sunset

| Component | Mongo? |
|-----------|--------|
| Platform API | **No** ✅ |
| CoreKnot server | **Yes** ❌ (~85 Mongoose models) |

Exit: all `COREKNOT_*_STORE=postgres`, `COREKNOT_MONGO_REQUIRED=false`, remove mongoose dep, deprovision Atlas.

Detail: [MONGO-SUNSET-REPORT.md](./MONGO-SUNSET-REPORT.md)

---

## 9. Environments & CI

- Templates: `.env.shared.example`, `.env.platform.example`, `.env.coreknot.example`
- CI: GitHub Actions `ci.yml` — lint, typecheck, test, build
- Deploy: Railway (APIs) + Vercel (frontends) on merge to `main`

Detail: [ENV-STANDARD.md](./ENV-STANDARD.md) · [CI-CD-STANDARD.md](./CI-CD-STANDARD.md) · [NAMING-CONVENTIONS.md](./NAMING-CONVENTIONS.md)

---

## 10. Acceptance criteria checklist

| Criterion | Status |
|-----------|--------|
| One shared PostgreSQL, Redis, Clerk, analytics | 🟡 Infra designed; founder secrets pending |
| Separate Platform API and CoreKnot API | ✅ Code exists; DNS/deploy pending |
| Website/Community → Platform API only | ✅ Env standard documented |
| CoreKnot → CoreKnot API only | 🟡 Client correct; some Platform API duplicate modules |
| No Mongo runtime dependency | ❌ CoreKnot still requires Mongo |
| Clear repo ownership, naming, deploy | ✅ Documented; extraction pending |
| Complete documentation | ✅ This architecture set |

---

## 11. Critical blockers (production)

1. **Founder FOUNDER-TASKS 0/8** — Clerk, Neon prod, Redis, Railway, Vercel, Cloudflare DNS
2. **CoreKnot Mongo** — cannot decommission API until Postgres cutover complete
3. **Clerk webhooks** — user provisioning gap
4. **Prisma migration drift** on Neon
5. **E2E failures** — 5/8 scenarios broken

Detail: [TECH-DEBT-ROADMAP.md](./TECH-DEBT-ROADMAP.md)

---

## 12. Path to production (ordered)

1. Founder completes [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) Steps 1–5
2. Reconcile Prisma migrations on Neon
3. Deploy Platform API to Railway; attach `api.theshakticollective.in`
4. Deploy Community + Website to Vercel
5. CoreKnot Postgres P0 domains + parallel-run (30 days)
6. Wire Clerk webhooks; remove stub in prod
7. Deploy CoreKnot API + workers to Railway; `api.coreknot.in`
8. Flip `COREKNOT_MONGO_REQUIRED=false`; deprovision Atlas
9. Extract `tsc-coreknot` repo; archive deprecated GitHub repos
10. Remove Platform API CoreKnot compat modules

Operational runbooks: [../DEPLOYMENT.md](../DEPLOYMENT.md) · [../RUNBOOK.md](../RUNBOOK.md)

---

## 13. Document hierarchy

When documents conflict, precedence order:

1. **This file** (`MASTER-PRODUCTION-ARCHITECTURE.md`)
2. `docs/architecture/*.md`
3. `docs/SETUP.md`, `DEPLOYMENT.md`, `OPERATIONS.md`, `RUNBOOK.md`
4. `ENVIRONMENT_GUIDE.md`
5. `.specify/MASTER.md` (agent index — defer to architecture for topology)
6. `docs/migration/*` (historical — see `docs/archive/`)

---

## 14. Related links

| Resource | Path |
|----------|------|
| Agent entry | [AGENTS.md](../../AGENTS.md) |
| Agent memory | [.agents/MEMORY.md](../../.agents/MEMORY.md) |
| CoreKnot founder launch | [FOUNDER-COREKNOT-LAUNCH.md](../FOUNDER-COREKNOT-LAUNCH.md) (aligned) |
| Local setup | [../SETUP.md](../SETUP.md) |
