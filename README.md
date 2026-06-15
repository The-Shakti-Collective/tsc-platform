# TSC Platform

The Shakti Collective monorepo — Platform API, Website, Community, and shared packages.

**Architecture (canonical):** [docs/architecture/](./docs/architecture/) · [MASTER-PRODUCTION-ARCHITECTURE.md](./docs/architecture/MASTER-PRODUCTION-ARCHITECTURE.md)  
**Production readiness:** [docs/readiness/](./docs/readiness/) · [verdict: NOT READY](./docs/readiness/MASTER-PRODUCTION-READINESS-REPORT.md)  
**Tech debt elimination:** [docs/elimination/](./docs/elimination/) · [master report (Agent 18)](./docs/elimination/MASTER-TECH-DEBT-ELIMINATION-REPORT.md)  
**Agent entry point:** [AGENTS.md](./AGENTS.md) · **Developer index:** [.specify/MASTER.md](./.specify/MASTER.md)  
**Setup / deploy / ops:** [docs/SETUP.md](./docs/SETUP.md) · [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) · [docs/RUNBOOK.md](./docs/RUNBOOK.md)  
**Env vars:** [ENV-STANDARD.md](./docs/architecture/ENV-STANDARD.md) · [ENVIRONMENT_GUIDE.md](./ENVIRONMENT_GUIDE.md)

| Component | Role |
|-----------|------|
| **tsc-platform** (this repo) | Monorepo — `apps/api`, `apps/website`, `apps/community`, `packages/*` |
| **tsc-coreknot** | Internal CRM, finance, operations — extract target: `apps/coreknot/` |
| **tsc-shared** | Published `@tsc/*` packages |
| **tsc-infra** / **tsc-docs** | Infrastructure templates and public API docs |
| **Neon PostgreSQL** | Shared database (source of truth) |
| **Railway** | Platform API + CoreKnot API/workers |
| **Vercel** | Website, Community, CoreKnot client |
| **Clerk** | Authentication and identity |

Deprecated standalone repos (`tsc-api`, `tsc-community`, `tsc-web`) — see [REPOSITORY-GOVERNANCE.md](./docs/architecture/REPOSITORY-GOVERNANCE.md).

## TL;DR

```powershell
pnpm setup    # first time only
pnpm start    # Postgres + Redis + API + Community
```

- Community: http://localhost:3000  
- API: http://localhost:4000/api

On Windows, if Turbo fails, use `pnpm build:fallback` or per-app `pnpm dev:api` — see [monorepo-structure.md](./.specify/architecture/monorepo-structure.md).
