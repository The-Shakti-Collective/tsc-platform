# TSC Platform

The Sound Collective monorepo — API, community app, shared packages.

**Agent entry point:** [AGENTS.md](./AGENTS.md) · **Architecture index:** [.specify/MASTER.md](./.specify/MASTER.md)  
**Local dev:** [.specify/infrastructure/local-dev.md](./.specify/infrastructure/local-dev.md) · **Monorepo:** [.specify/architecture/monorepo-structure.md](./.specify/architecture/monorepo-structure.md) · **Env vars:** [ENVIRONMENT_GUIDE.md](./ENVIRONMENT_GUIDE.md)

| Platform | Role |
|----------|------|
| **GitHub Organization (TheShaktiCollective)** | Central home for all code repositories |
| **tsc-api** | Main backend and business logic |
| **tsc-coreknot** | Internal CRM, artist management, finance, operations |
| **tsc-community** | Public community platform for artists, fans, managers |
| **tsc-web** | Marketing website, landing pages, SEO |
| **tsc-shared** | Shared types, contracts, permissions, constants |
| **Neon PostgreSQL** | Main database (source of truth) |
| **Railway** | Backend hosting and Redis hosting |
| **Vercel** | Frontend hosting (Website, Community, CoreKnot) |
| **Clerk** | Authentication and user management |

## TL;DR

```powershell
pnpm setup    # first time only
pnpm start    # Postgres + Redis + API + Community
```

- Community: http://localhost:3000  
- API: http://localhost:4000/api

On Windows, if Turbo fails, use `pnpm build:fallback` or per-app `pnpm dev:api` — see [monorepo-structure.md](./.specify/architecture/monorepo-structure.md).
