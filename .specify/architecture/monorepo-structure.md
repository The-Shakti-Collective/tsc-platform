# Monorepo Structure

[← Master index](../MASTER.md)

## Workspace Configuration

**Package manager:** pnpm 9.15.0 (`packageManager` in root `package.json`)  
**Build orchestration:** Turbo 2.x (`turbo.json`)  
**Workspaces** (`pnpm-workspace.yaml`):

```yaml
packages:
  - "apps/*"
  - "apps/coreknot/client"
  - "packages/*"
  - "e2e"
```

The explicit `apps/coreknot/client` entry is required because the parent `apps/coreknot/` folder is **legacy source** and is not itself a workspace package. `@tsc/e2e` (Playwright smoke) lives at `e2e/`.

---

## Directory Tree

```mermaid
flowchart TB
    ROOT["tsc-platform/"]
    
    ROOT --> APPS["apps/"]
    ROOT --> PKGS["packages/"]
    ROOT --> SCRIPTS["scripts/"]
    ROOT --> SCAFFOLD["org-scaffold/"]
    ROOT --> AGENTS[".agents/"]
    ROOT --> SPECIFY[".specify/"]

    APPS --> API["api/ @tsc/api"]
    APPS --> COMM["community/ @tsc/community"]
    APPS --> CKROOT["coreknot/ legacy sources"]
    CKROOT --> CKCLIENT["client/ @tsc/coreknot-client"]
    APPS --> WEB["website/ @tsc/website"]

    ROOT --> E2E["e2e/ @tsc/e2e"]

    PKGS --> DB["database"]
    PKGS --> SHARED["types, contracts, permissions, ui"]
    PKGS --> DOMAIN["graph, reputation, search, analytics"]
    PKGS --> SDK["community-sdk"]
    PKGS --> OPS["workspace, projects, tasks"]
```

---

## Workspace Members

Run `pnpm m ls --depth -1` to reproduce this list.

### Applications (4)

| Package | Path | Framework | Port |
|---------|------|-----------|------|
| `@tsc/api` | `apps/api/` | NestJS 11 | 4000 |
| `@tsc/community` | `apps/community/` | Next.js 15 | 3000 |
| `@tsc/coreknot-client` | `apps/coreknot/client/` | Vite 6 + React 19 | 3001 |
| `@tsc/website` | `apps/website/` | Next.js 15 | 3002 |

### Test package (1)

| Package | Path | Role |
|---------|------|------|
| `@tsc/e2e` | `e2e/` | Playwright smoke tests |

### Shared packages (13)

| Package | Path | Role |
|---------|------|------|
| `@tsc/database` | `packages/database/` | Prisma schema + client export |
| `@tsc/types` | `packages/types/` | Shared TypeScript types |
| `@tsc/contracts` | `packages/contracts/` | Zod schemas / API contracts |
| `@tsc/permissions` | `packages/permissions/` | RBAC helpers |
| `@tsc/community-sdk` | `packages/community-sdk/` | Community frontend API client |
| `@tsc/ui` | `packages/ui/` | Shared UI primitives |
| `@tsc/analytics` | `packages/analytics/` | Analytics domain logic |
| `@tsc/graph` | `packages/graph/` | Graph entity/relationship logic |
| `@tsc/reputation` | `packages/reputation/` | Reputation scoring |
| `@tsc/search` | `packages/search/` | Search helpers |
| `@tsc/workspace` | `packages/workspace/` | Workspace domain |
| `@tsc/projects` | `packages/projects/` | Project domain |
| `@tsc/tasks` | `packages/tasks/` | Task domain |

---

## Non-workspace paths

| Path | Status |
|------|--------|
| `apps/coreknot/` (parent) | Legacy React pages, API libs — not a pnpm package |
| `apps/web/` | Deprecated orphan (no `package.json`) — use `apps/website` |
| `org-scaffold/` | Future multi-repo templates — not part of workspace |
| `node_modules/` | Hoisted by pnpm |

---

## Turbo Task Graph

```mermaid
flowchart BT
    BUILD["build"]
    LINT["lint"]
    DEV["dev"]
    PV["prisma:validate"]

    BUILD -->|"dependsOn: ^build"| BUILD
    LINT -->|"dependsOn: ^build"| BUILD
    DEV -->|"cache: false, persistent"| DEV

    subgraph outputs["build outputs"]
        DIST["dist/**"]
        NEXT[".next/**"]
    end

    BUILD --> outputs
```

Root scripts (via `scripts/turbo-or-fallback.mjs` — on Windows Turbo crash, falls back to pnpm filters):

| Script | Behavior |
|--------|----------|
| `pnpm build` | Turbo → fallback; `@tsc/api...` dependency graph (Railway default) |
| `pnpm build:api` / `build:fallback` | Direct API graph build (no Turbo) |
| `pnpm build:all` | All workspace packages (`pnpm -r run build`) |
| `pnpm ci` / `ci:fallback` | lint → typecheck → test → build (Turbo or explicit fallback) |
| `pnpm test:e2e` | Playwright via `@tsc/e2e` |
| `pnpm verify:dist` | Check API deploy bundle artifacts |
| `pnpm dev` | Turbo parallel: `@tsc/api` + `@tsc/community` only |
| `pnpm dev:api` / `dev:community` / `dev:coreknot` / `dev:website` | Per-app dev (prefer on Windows over `pnpm dev`) |
| `pnpm lint` / `typecheck` / `test` | Turbo with `:fallback` variants available |

On Windows, native `turbo` may exit `-1073741515` (`STATUS_DLL_NOT_FOUND`). The wrapper runs pnpm filter/recursive equivalents. Prefer `:fallback` scripts when Turbo misbehaves. See [local-dev.md](../infrastructure/local-dev.md).

### Railway / nixpacks

Root [`nixpacks.toml`](../../nixpacks.toml) drives Railway deploy: `pnpm install --frozen-lockfile` → `db:generate` → `build` (API graph) → `verify:dist` → `pnpm --filter @tsc/api --prod deploy` → start via `scripts/railway-start.mjs`. Default `pnpm build` scope is `@tsc/api...` — frontends deploy separately (Vercel).

### Verification

| Check | Command | Pass |
|-------|---------|------|
| Workspace | `pnpm m ls --depth -1` | includes `@tsc/e2e`, `@tsc/api`, `@tsc/website` |
| API dist | `pnpm verify:dist` | `[verify:dist] OK` |
| API build | `pnpm build:api` | exit `0` |
| E2E wired | `pnpm --filter @tsc/e2e exec playwright --version` | prints version |

---

## Dependency Flow (Apps → Packages)

```mermaid
flowchart LR
    API["@tsc/api"]
    COMM["@tsc/community"]
    CK["@tsc/coreknot-client"]

    API --> DB["@tsc/database"]
    API --> CONTRACTS["@tsc/contracts"]
    API --> TYPES["@tsc/types"]
    API --> PERMS["@tsc/permissions"]
    API --> WS["@tsc/workspace"]
    API --> PROJ["@tsc/projects"]
    API --> TASKS["@tsc/tasks"]
    API --> ANALYTICS["@tsc/analytics"]

    COMM --> SDK["@tsc/community-sdk"]
    COMM --> CONTRACTS
    COMM --> TYPES

    CK -->|"no workspace deps"| EXT["Direct fetch /api proxy"]

    DB --> PRISMA["Prisma Client"]
    CONTRACTS --> DB
    REPUTATION["@tsc/reputation"] --> ANALYTICS
    REPUTATION --> DB
```

`@tsc/coreknot-client` has **no** workspace package dependencies — it calls the API via Vite proxy and local `src/lib/*Api.js` modules.

---

## Scripts Directory

| Script | Purpose |
|--------|---------|
| `setup.ps1` / `setup.sh` | First-time install + env + docker + db:push + build |
| `start-stack.ps1` | Infra + API + frontend launcher |
| `start-infra.ps1` | Smart Docker compose (Neon/Upstash aware) |
| `dev-stack.ps1` | API + frontend without infra |
| `stack-common.ps1` | Shared: health poll, browser open, API window |
| `run-api-dev.ps1` | Spawn API in separate PowerShell window |
| `run-frontend-dev.ps1` | Spawn frontend window |
| `kill-port.ps1` / `kill-all-dev-ports.ps1` | Port cleanup |
| `turbo-or-fallback.mjs` | Turbo wrapper; pnpm filter fallback on Windows |
| `verify-workspace-dist.mjs` | Pre-deploy dist artifact check |
| `stop.ps1` | `docker compose down` |

---

## org-scaffold vs Live Monorepo

`org-scaffold/` holds **copy-ready templates** for the planned GitHub org split:

| Scaffold folder | Target repo | Maps from monorepo |
|-----------------|-------------|-------------------|
| `tsc-shared/` | The-Shakti-Collective/tsc-shared | `packages/types`, `contracts`, `permissions`, `ui`, `community-sdk` |
| `tsc-api/` | tsc-api | `apps/api/` + `packages/database` + domain packages |
| `tsc-community/` | tsc-community | `apps/community/` |
| `tsc-coreknot/` | tsc-coreknot | `apps/coreknot/` |
| `tsc-web/` | tsc-web | Greenfield marketing site |
| `tsc-infra/` | tsc-infra | CI templates, docker-compose, branch docs |
| `tsc-docs/` | tsc-docs | OpenAPI spec stub |

The live monorepo uses `workspace:*` links. Extracted repos will use published `@tsc/*` from GitHub Packages.

See [operations/ci-cd.md](../operations/ci-cd.md) and [decisions/known-gaps.md](../decisions/known-gaps.md).

---

## Related

- [Packages overview](../packages/overview.md)
- [Local dev](../infrastructure/local-dev.md)
