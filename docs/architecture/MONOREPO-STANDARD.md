# Monorepo Standard — tsc-platform

> Package name: `tsc-platform` (root `package.json`)  
> Workspaces: pnpm + Turbo

## Target structure

```
tsc-platform/
├── apps/
│   ├── api/                 # NestJS Platform API (@tsc/api)
│   ├── website/             # Next.js marketing (@tsc/website)
│   └── community/           # Next.js community (@tsc/community)
├── packages/
│   ├── analytics/           # @tsc/analytics
│   ├── contracts/           # @tsc/contracts — shared DTOs, OpenAPI types
│   ├── database/            # @tsc/database — Prisma schema + client
│   ├── permissions/         # @tsc/permissions — RBAC helpers
│   ├── search/              # @tsc/search — Typesense client
│   └── workspace/           # @tsc/workspace — workspace domain logic
├── docs/
│   ├── architecture/        # Production architecture (canonical)
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   ├── OPERATIONS.md
│   └── RUNBOOK.md
├── e2e/                     # Playwright + migration smoke tests
├── scripts/                 # Dev stack, deploy, migrations
├── .github/workflows/       # CI/CD
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── railway.json             # Platform API deploy (repo root)
└── nixpacks.toml
```

## Current structure (gap analysis)

| Path | Target | Current | Action |
|------|--------|---------|--------|
| `apps/api` | ✅ | ✅ NestJS | Keep |
| `apps/website` | ✅ | ✅ Next.js | Keep |
| `apps/community` | ✅ | ✅ Next.js | Keep |
| `apps/coreknot/` | ❌ extract | Present (client, server, shared) | Move to `tsc-coreknot` repo |
| `packages/analytics` | ✅ | ✅ | Keep |
| `packages/contracts` | ✅ | ✅ | Keep |
| `packages/database` | ✅ | ✅ | Keep |
| `packages/permissions` | ✅ | ✅ | Keep |
| `packages/search` | ✅ | ✅ | Keep |
| `packages/workspace` | ✅ | ✅ | Keep |
| `packages/graph` | consolidate? | Present | Keep until Audience OS stable; may merge |
| `packages/reputation` | consolidate? | Present | Same |
| `packages/projects` | CoreKnot? | Present | Evaluate — domain belongs to CoreKnot |
| `packages/tasks` | CoreKnot? | Present | Evaluate |
| `packages/community-sdk` | ✅ | Present | Keep for Community client helpers |
| `packages/constants`, `types`, `ui` | support | Present | Keep as shared utilities |
| `org-scaffold/` | ❌ | Present | Archive after infra extraction |

## Workspace definition (pnpm)

From root `package.json`:

```json
"workspaces": [
  "apps/*",
  "apps/coreknot/client",
  "apps/coreknot/server",
  "apps/coreknot/shared/contracts",
  "packages/*",
  "e2e"
]
```

**Target:** Remove CoreKnot paths when extracted to `tsc-coreknot`.

## Rules

### Frontends have no backend

- **Community** and **Website** are Next.js apps. They call **Platform API** via `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_TSC_API_URL`.
- They do **not** define Prisma schemas, Mongo connections, or standalone Express servers.
- Server Components may use Clerk; data mutations go to Platform API.

### Platform API is the only TSC backend

- All Community/Website data reads/writes route to `apps/api`.
- No `apps/community/api/` persistence layer beyond Next.js route handlers that proxy to Platform API.

### Packages are library-only

- `packages/*` export TypeScript modules consumed by apps.
- Only `@tsc/database` runs Prisma CLI; it does not start an HTTP server.

### CoreKnot does not belong in tsc-platform (target)

- CoreKnot server uses Mongoose + Express — different stack, different deploy, different API host.
- Temporary nesting is acceptable during migration; permanent nesting violates [COREKNOT-BOUNDARY.md](./COREKNOT-BOUNDARY.md).

## Scripts (canonical)

| Command | Purpose |
|---------|---------|
| `pnpm start:community` | Community + Platform API stack |
| `pnpm start:coreknot` | CoreKnot client + server (until extracted) |
| `pnpm start:website` | Website stack |
| `pnpm db:generate` | Prisma client from `packages/database` |
| `pnpm ci` | lint + typecheck + test + build |
| `pnpm sweep:local` | Local health sweep |
| `pnpm sweep:prod` | Production health sweep |

## Turbo pipeline

Build order respects dependency graph: `packages/*` → `apps/api` → frontends. Filter examples:

```bash
pnpm --filter @tsc/api... run build
pnpm --filter @tsc/community run build
```

## Import conventions

- Apps import packages: `@tsc/database`, `@tsc/contracts`, etc.
- Apps do **not** import from `apps/coreknot/server` (cross-app boundary).
- CoreKnot may import `@tsc/database` during Postgres migration; long-term via `@tsc/shared` published package.
