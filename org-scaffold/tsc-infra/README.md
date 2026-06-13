# tsc-infra

Infrastructure, CI/CD templates, deploy configs, and local dev tooling for The Shakti Collective.

Aligned with `.agents/production-setup-runbook.md` in the TSC Platform monorepo.

## Contents

```
tsc-infra/
├── .github/workflows/     # Reusable workflow templates (copy to app repos)
├── cloudflare/            # DNS records, R2 setup
├── clerk/                 # Auth configuration guide
├── typesense/             # Search cluster setup
├── docs/                  # Branch strategy, env matrix, rollback, health
├── local/                 # docker-compose for local stack
├── railway/               # Railway service templates (staging + prod)
├── scripts/               # setup-local, deploy, health-check, rollback
├── terraform/stubs/       # IaC placeholders
├── vercel/                # Per-project vercel.json templates
└── tooling/               # Shared ESLint, TSConfig bases
```

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/setup-local.ps1` | Start Postgres + Redis (Docker) |
| `scripts/setup-local.sh` | Same (bash) |
| `scripts/health-check.ps1` | Smoke all service health endpoints |
| `scripts/health-check.sh` | Same (bash / CI) |
| `scripts/deploy-api.ps1` | Railway deploy + optional migrate |
| `scripts/deploy-vercel.ps1` | Vercel deploy or rollback |
| `scripts/rollback-railway.ps1` | Redeploy previous Railway build |

## Monorepo migration sources

| Monorepo path | Target |
|---------------|--------|
| `tooling/` | `tooling/` |
| `scripts/` | `scripts/` |
| `docker-compose.yml` | `local/docker-compose.yml` |
| `.agents/infra/` | `docs/` (reference) |
| CI patterns | `.github/workflows/` |

## Usage

1. Bootstrap repo to GitHub org (see runbook Appendix)
2. Copy relevant workflow from `.github/workflows/` into each app repo
3. Configure org secrets (see `docs/environment-matrix.md`)
4. Run `scripts/setup-local.ps1` for Postgres + Redis locally
5. After deploy: `scripts/health-check.ps1 -Environment staging -Strict`

## Not deployed

This repo holds configuration and templates only — no runtime service.
