# Naming Conventions

> Reject temporary names. Use these consistently in code, docs, DNS, and GitHub.

## Product names (public)

| Canonical | Use in UI/docs | Reject |
|-----------|----------------|--------|
| **TSC Platform** | Ecosystem umbrella | platform-next, tsc-ecosystem-v2 |
| **TSC Community** | Community app | community-app, tsc-social |
| **TSC Website** | Marketing site | tsc-web, web, website-app |
| **CoreKnot** | Staff CRM/ERP | coreknot-new, tsccoreknot, TaskMaster |
| **TSC Shared** | Published packages | tsc-packages, shared-libs |
| **TSC Infra** | DNS/deploy repo | infra-scripts |

## GitHub repositories

| Repo | Package scope |
|------|---------------|
| `tsc-platform` | Monorepo root name |
| `tsc-coreknot` | Extracted CoreKnot |
| `tsc-shared` | `@tsc/*` npm |
| `tsc-infra` | No npm |
| `tsc-docs` | No npm |

**Reject:** `tsc-api`, `tsc-community`, `tsc-web` as standalone repos (deprecated).

## npm package names

| Package | Name |
|---------|------|
| Platform API | `@tsc/api` |
| Community | `@tsc/community` |
| Website | `@tsc/website` |
| CoreKnot client | `@tsc/coreknot-client` |
| CoreKnot server | `@tsc/coreknot-server` |
| Database | `@tsc/database` |
| Contracts | `@tsc/contracts` |

**Reject:** `@tsc/api-v2`, `@tsc/backend-new`

## Domains

| Purpose | Domain |
|---------|--------|
| Marketing | `theshakticollective.in` |
| Community (path or subdomain) | `theshakticollective.in/community` |
| Platform API | `api.theshakticollective.in` |
| CoreKnot app | `coreknot.in` |
| CoreKnot API | `api.coreknot.in` |

## Environment variable prefixes

| Prefix | Meaning |
|--------|---------|
| `TSC_*` | Platform-wide flags |
| `COREKNOT_*` | CoreKnot-specific (store flags, Postgres cutover) |
| `NEXT_PUBLIC_*` | Next.js browser |
| `VITE_*` | CoreKnot client browser |
| `CLERK_*` | Clerk secrets (server) |
| `NEXT_PUBLIC_CLERK_*` | Clerk public |

**Reject:** `TM_*`, `TASKMASTER_*` in new code (legacy Mongo era).

## Code & paths

| Concept | Convention |
|---------|--------------|
| NestJS modules | `kebab-case.module.ts` |
| API routes | `/api/<domain>` lowercase |
| Prisma models | PascalCase singular |
| Mongo collections (legacy) | lowercase plural — do not add new |
| Docs | `UPPER-CASE-WITH-DASHES.md` in `docs/architecture/` |

## Deployment service names (Railway/Vercel)

| Service | Name |
|---------|------|
| Platform API | `tsc-platform-api` |
| CoreKnot API | `coreknot-api` |
| CoreKnot workers | `coreknot-workers` |
| Vercel — Website | `tsc-website` |
| Vercel — Community | `tsc-community` |
| Vercel — CoreKnot | `tsc-coreknot` |

## Agent / internal docs

- Use **TSC Platform** not "the monorepo backend"
- Use **CoreKnot** not "the ERP" or "taskmaster"
- Reference [docs/architecture/MASTER-PRODUCTION-ARCHITECTURE.md](./MASTER-PRODUCTION-ARCHITECTURE.md) as architecture authority
