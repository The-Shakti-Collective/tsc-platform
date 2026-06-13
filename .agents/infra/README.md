# TSC Platform — Infrastructure (Recovery Sprint)

Production infrastructure definitions for The Shakti Collective. Aligned with [production-setup-runbook.md](../production-setup-runbook.md).

**Do not commit secrets.** Set values in Railway, Vercel, GitHub Organization secrets, and Cloudflare dashboard only.

## Contents

| Document | Purpose |
|----------|---------|
| [environment-matrix.md](./environment-matrix.md) | Env vars per service × environment (no secret values) |
| [health-checks.md](./health-checks.md) | Liveness/readiness endpoints and platform config |
| [rollback-strategy.md](./rollback-strategy.md) | Rollback procedures per platform |
| [deployment-readiness.md](./deployment-readiness.md) | Readiness scorecard and gaps |
| [services/](./services/) | Per-service setup guides |

## Scaffold source of truth

Copy-ready configs live in `org-scaffold/tsc-infra/`:

```
org-scaffold/tsc-infra/
├── cloudflare/       # DNS, R2
├── clerk/            # Auth setup
├── typesense/        # Search cluster
├── railway/          # tsc-api templates
├── vercel/           # Frontend project configs
├── scripts/          # Deploy, health-check, rollback
└── docs/             # Branch strategy, shared runbooks
```

## Target platforms

| Platform | Services |
|----------|----------|
| **Railway** | tsc-api (staging + prod) |
| **Vercel** | tsc-web, tsc-community, tsc-coreknot, tsc-docs |
| **Cloudflare** | DNS, CDN, R2 object storage |
| **Neon** | PostgreSQL (via `DATABASE_URL` on Railway) |
| **Upstash** | Redis / BullMQ (via `REDIS_URL` on Railway) |
| **Typesense Cloud** | Full-text search |
| **Clerk** | Auth (all frontends + API JWT) |

## Quick commands

```powershell
# Local stack
.\org-scaffold\tsc-infra\scripts\setup-local.ps1

# Post-deploy smoke (set env first)
.\org-scaffold\tsc-infra\scripts\health-check.ps1 -Environment staging

# Railway rollback (requires RAILWAY_TOKEN)
.\org-scaffold\tsc-infra\scripts\rollback-railway.ps1 -Environment staging
```

## Migration note

During monorepo recovery, infra docs live here (`.agents/infra/`). After `tsc-infra` repo bootstrap, push `org-scaffold/tsc-infra/` to [The-Shakti-Collective/tsc-infra](https://github.com/The-Shakti-Collective/tsc-infra) and treat that repo as canonical.
