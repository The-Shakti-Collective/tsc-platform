# Database Package (`@tsc/database`)

[← Master index](../MASTER.md)

## Overview

| Property | Value |
|----------|-------|
| Path | `packages/database/` |
| ORM | Prisma 6.x |
| Provider | PostgreSQL |
| Schema | `prisma/schema.prisma` |
| Models | ~95 (merged Stage 1 schema) |

The database package is the **single source of truth** for all Postgres structure in the monorepo.

---

## Schema Architecture

```mermaid
flowchart TB
    SCHEMA["schema.prisma<br/>canonical merged"]
    PHASE["phase*.prisma<br/>audit fragments"]
    MIGRATE["migrations/<br/>.gitkeep only"]
    
    PHASE -.->|"reference only"| SCHEMA
    SCHEMA --> GENERATE["prisma generate"]
    GENERATE --> CLIENT["@prisma/client"]
    CLIENT --> DIST["dist/ exports"]
```

Schema header comment:

> TSC Platform — canonical merged schema (Stage 1 Step 1). Phase fragments retained in `prisma/phase*.prisma` for audit trail.

### Key enums (sample)

- `GraphEntityType` — Artist, Venue, Person, Community, …
- `RelationshipType` — MANAGES, COLLABORATED_WITH, FOLLOWS, …
- `FanIntelligenceTier` — audience segmentation

Full model list: open `packages/database/prisma/schema.prisma`.

---

## Exports

```json
// packages/database/package.json exports
".": "./dist/index.js"
"./client": "./dist/client.js"
```

| Export | Use case |
|--------|----------|
| `@tsc/database` | Package-level helpers |
| `@tsc/database/client` | Direct Prisma client in packages |

API uses `apps/api/src/common/database/prisma.module.ts` for NestJS DI.

---

## Commands

Root scripts delegate to `@tsc/database`:

| Command | Prisma command | When to use |
|---------|----------------|-------------|
| `pnpm db:generate` | `prisma generate` | After schema changes |
| `pnpm db:validate` | `prisma validate` | CI / pre-commit check |
| `pnpm db:push` | `prisma db push` | **Current default** — dev schema sync |
| `pnpm db:migrate` | `prisma migrate dev` | When migration files exist |
| `pnpm db:studio` | `prisma studio` | GUI at :5555 |

---

## db:push vs migrate

```mermaid
flowchart TD
    DEV["Local / dev branch"]
    STAGING["Staging Neon"]
    PROD["Production Neon"]

    DEV -->|"pnpm db:push"| DEV_DB[("Dev DB")]
    STAGING -->|"prisma migrate deploy"| STG_DB[("Staging DB")]
    PROD -->|"prisma migrate deploy"| PROD_DB[("Prod DB")]

    SCHEMA["schema.prisma changes"] --> DEV
    SCHEMA -->|"create migration"| MIGRATIONS["prisma/migrations/*.sql"]
    MIGRATIONS --> STAGING
    MIGRATIONS --> PROD
```

### Current state

| Aspect | Status |
|--------|--------|
| Migration history | **None** — only `migrations/.gitkeep` |
| Dev workflow | `pnpm db:push` (used by `setup.ps1`) |
| Prod workflow (planned) | `prisma migrate deploy` on Railway deploy |
| Risk | `db:push` can drift without versioned migrations |

### Recommended path forward

1. Baseline migration from current schema: `prisma migrate dev --name init`
2. Commit `prisma/migrations/` to git
3. Use `db:push` only for rapid local iteration
4. Railway deploy hook runs `prisma migrate deploy`

---

## Connection Strings

### Local Docker (default in `.env.example`)

```
postgresql://postgres:postgres@localhost:5432/tsc_community
```

Docker compose (`docker-compose.yml`):

- Image: `postgres:16-alpine`
- Container: `tsc-postgres`
- Port: `5432`
- DB: `tsc_community`

### Neon (remote)

```
postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
```

When `DATABASE_URL` contains `neon.tech`, `start-infra.ps1` **skips** local Postgres container.

### Production runbook note

`org-scaffold` and runbook mention alternate local creds `postgresql://tsc:tsc@localhost:5432/tsc_dev` — **differs** from live `docker-compose.yml` (`postgres/postgres/tsc_community`). Use `.env.example` as canonical for this monorepo.

---

## Prisma in Build Pipeline

```mermaid
sequenceDiagram
    participant Setup as pnpm setup
    participant Gen as db:generate
    participant Push as db:push
    participant Build as pnpm build

    Setup->>Gen: prisma generate
    Gen->>Push: apply schema
    Push->>Build: compile packages
    Build->>Build: @tsc/database tsc
    Build->>Build: API + apps
```

`@tsc/database` build script is `tsc` only (health gate removed inline `prisma generate`). Root `pnpm build` runs `db:generate` first, so the client is already generated before package compile — avoids re-running Prisma inside the package build, which can hit OneDrive `EPERM` on the Prisma query-engine DLL on Windows.

---

## API Data Access Pattern

Repositories in `apps/api/src/modules/*/*.repository.ts` inject `PrismaService` and query generated client types.

Domain packages (`@tsc/graph`, etc.) import `@tsc/database/client` directly for shared queries.

---

## Neon Branch Strategy (Production)

| Branch | Environment | Consumer |
|--------|-------------|----------|
| `dev` | Local + previews | Developers |
| `staging` | Railway `develop` | Staging API |
| `main` / `prod` | Railway `main` | Production API |

---

## Related

- [data-flow.md](../architecture/data-flow.md)
- [local-dev.md](../infrastructure/local-dev.md)
- [env-vars.md](../infrastructure/env-vars.md)
