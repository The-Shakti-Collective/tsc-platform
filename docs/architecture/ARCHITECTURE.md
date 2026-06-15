# TSC Platform Architecture

> Authority document for product topology and system ownership.  
> See also: [SYSTEM_CONTEXT.md](./SYSTEM_CONTEXT.md) · [MASTER-PRODUCTION-ARCHITECTURE.md](./MASTER-PRODUCTION-ARCHITECTURE.md)

## Executive summary

The Shakti Collective operates **two products** on **shared infrastructure**:

| Product | Domain | Primary users | Backend |
|---------|--------|---------------|---------|
| **TSC Platform** | `theshakticollective.in` | Artists, fans, community members, brands | `api.theshakticollective.in` |
| **CoreKnot** | `coreknot.in` | Internal staff, operators, CRM users | `api.coreknot.in` |

Both products share **one Neon PostgreSQL cluster**, **one Redis**, **Clerk** (identity), **PostHog**, **Sentry**, and **Cloudflare** (DNS, R2).

## Product ownership

### TSC Platform owns

- **TSC Website** — marketing, public pages, lead capture webhooks
- **TSC Community** — social feed, profiles, onboarding, opportunities
- **Platform API** (`apps/api`) — NestJS, Prisma, public and member-facing REST
- **Audience OS** — fan intelligence, passport, graph, reputation
- **Marketplace** — listings, commerce experiences
- **Events** — community events, participation, intelligence snapshots
- **Memberships & Rewards** — tiers, subscriptions, redemptions
- **Public Analytics** — community-facing metrics (not internal ops dashboards)

### CoreKnot owns

- **CoreKnot Client** — Vite/React SPA for staff (`apps/coreknot/client`)
- **CoreKnot API** — Express server (`apps/coreknot/server`)
- **CoreKnot Workers** — BullMQ background jobs (`apps/coreknot/server/workers`)
- **CRM** — leads, pipelines, assignments
- **Projects & Tasks** — workspaces, goals, checklists, reviews
- **Finance** — documents, expenses, OCR workflows
- **Contracts & Invoicing** — templates, billing, payouts (operations context)
- **Attendance** — office IP, leave, daily missions
- **Internal Operations** — mail campaigns, data hub, integrations, gamification

## Repository map (target)

| GitHub repo | Contents | Deploy |
|-------------|----------|--------|
| `TheShaktiCollective/tsc-platform` | `apps/api`, `apps/website`, `apps/community`, `packages/*`, `docs/` | Railway + Vercel |
| `TheShaktiCollective/tsc-coreknot` | `client/`, `server/`, `workers/`, `docs/` | Vercel + Railway |
| `TheShaktiCollective/tsc-shared` | Published `@tsc/*` packages (extracted from monorepo) | npm/GitHub Packages |
| `TheShaktiCollective/tsc-infra` | DNS, Railway/Vercel config, Terraform stubs | — |
| `TheShaktiCollective/tsc-docs` | OpenAPI exports, public API reference | Vercel static |

**Current state:** All apps live in the **monorepo** (`tsc-platform`). CoreKnot is nested at `apps/coreknot/` pending extraction to `tsc-coreknot`.

## Runtime topology

```
                    ┌─────────────────────────────────────────┐
                    │           Cloudflare DNS + R2           │
                    └─────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  theshakticollective.in   community.*          coreknot.in
  (Vercel Website)         (Vercel Community)   (Vercel Client)
         │                    │                    │
         └──────────┬─────────┘                    │
                    ▼                              ▼
         api.theshakticollective.in        api.coreknot.in
         (Railway — NestJS Platform API)    (Railway — Express + Workers)
                    │                              │
                    └──────────┬───────────────────┘
                               ▼
              ┌────────────────────────────────────┐
              │  Neon PostgreSQL  │  Redis (BullMQ) │
              │  Clerk  │  PostHog  │  Sentry       │
              └────────────────────────────────────┘
```

## Current gaps (2026-06-15)

These violate target architecture and are tracked in [TECH-DEBT-ROADMAP.md](./TECH-DEBT-ROADMAP.md):

1. **Platform API includes CoreKnot domain modules** — `CrmModule`, `InvoicesModule`, `ProjectModule`, `TaskModule`, `GigsModule`, etc. in `apps/api/src/app.module.ts`. Transitional via `CoreknotCompatModule`; must not become permanent dual ownership.
2. **CoreKnot server is Mongo-primary** — ~90 Mongoose models; Postgres cutover uses per-domain `COREKNOT_*_STORE` flags.
3. **CoreKnot auth is JWT**, not Clerk — staff login separate from Platform Clerk flow.
4. **Render config archived** — `docs/archive/render.coreknot.legacy.yaml`; target deploy is Railway only.
5. **Monorepo still contains `org-scaffold/`** — templates for deprecated split repos (`tsc-api`, `tsc-web`, `tsc-community`).

## Decision rules

1. **One database cluster** — single Neon project; logical ownership via schema/table map, not separate DBs per product.
2. **Two APIs** — public/member traffic never routes through CoreKnot API; staff ops never route through Platform API (except explicit cross-service webhooks).
3. **Frontends are thin** — Website and Community call Platform API only. CoreKnot Client calls CoreKnot API only.
4. **No third backend** — Community and Website do not have their own servers beyond Next.js SSR/BFF patterns that proxy to Platform API.

## Ports (local dev)

| Service | Port | Package |
|---------|------|---------|
| TSC Community | 3000 | `@tsc/community` |
| CoreKnot Client | 3001 | `@tsc/coreknot-client` |
| TSC Website | 3002 | `@tsc/website` |
| Platform API | 4000 | `@tsc/api` |
| CoreKnot API | 5000 | `@tsc/coreknot-server` |

Start: `pnpm start:community` · `pnpm start:coreknot` · `pnpm start:website`
