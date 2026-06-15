# TSC Production Architecture — Index

> **Canonical source of truth:** [MASTER-PRODUCTION-ARCHITECTURE.md](./MASTER-PRODUCTION-ARCHITECTURE.md)  
> Last updated: 2026-06-15

This directory defines the **permanent** production architecture for The Shakti Collective. All other docs defer here when they conflict.

## Documents

| Document | Purpose |
|----------|---------|
| [MASTER-PRODUCTION-ARCHITECTURE.md](./MASTER-PRODUCTION-ARCHITECTURE.md) | Synthesized authority — read first |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System topology, products, ownership |
| [SYSTEM_CONTEXT.md](./SYSTEM_CONTEXT.md) | Boundaries, actors, external systems |
| [REPOSITORY-GOVERNANCE.md](./REPOSITORY-GOVERNANCE.md) | GitHub org repos — keep, deprecate, archive |
| [MONOREPO-STANDARD.md](./MONOREPO-STANDARD.md) | `tsc-platform` layout and rules |
| [COREKNOT-BOUNDARY.md](./COREKNOT-BOUNDARY.md) | CoreKnot vs Platform separation |
| [DATA-OWNERSHIP-MAP.md](./DATA-OWNERSHIP-MAP.md) | Neon PostgreSQL table ownership |
| [AUTH-ARCHITECTURE.md](./AUTH-ARCHITECTURE.md) | Clerk, legacy JWT, removal plan |
| [API-BOUNDARY.md](./API-BOUNDARY.md) | `api.theshakticollective.in` vs `api.coreknot.in` |
| [MONGO-SUNSET-REPORT.md](./MONGO-SUNSET-REPORT.md) | Mongo eradication classification |
| [DEPLOYMENT-ARCHITECTURE.md](./DEPLOYMENT-ARCHITECTURE.md) | Vercel, Railway, Cloudflare, Neon |
| [ENV-STANDARD.md](./ENV-STANDARD.md) | Normalized env files and load order |
| [CI-CD-STANDARD.md](./CI-CD-STANDARD.md) | GitHub Actions and deploy pipelines |
| [NAMING-CONVENTIONS.md](./NAMING-CONVENTIONS.md) | Product, repo, and code naming |
| [TECH-DEBT-ROADMAP.md](./TECH-DEBT-ROADMAP.md) | Prioritized remediation backlog |
| [Elimination reports](../elimination/README.md) | Worker A boundary compliance (Agents 01, 06, 10) |

## Tech debt elimination (Worker D — 2026-06-15)

| Document | Purpose |
|----------|---------|
| [Elimination index](../elimination/README.md) | Agents 02, 03, 11–13, 15–17 certificates |

## Production readiness (2026-06-15 audit)

| Document | Purpose |
|----------|---------|
| [Readiness index](../readiness/README.md) | Pre-production audit wave (Agents 15–25) |
| [Master readiness report](../readiness/MASTER-PRODUCTION-READINESS-REPORT.md) | **NOT READY** — verdict, blockers, 15-point checklist |

## Related operational docs

| Document | Location |
|----------|----------|
| Setup | [../SETUP.md](../SETUP.md) |
| Deployment | [../DEPLOYMENT.md](../DEPLOYMENT.md) |
| Operations | [../OPERATIONS.md](../OPERATIONS.md) |
| Runbook | [../RUNBOOK.md](../RUNBOOK.md) |
| Environment matrix (legacy) | [../../ENVIRONMENT_GUIDE.md](../../ENVIRONMENT_GUIDE.md) |
| Founder checklist | [../../.specify/agents/execution/FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) |

## Superseded material

Migration-era docs moved to [../archive/](../archive/README.md). Do not treat them as canonical.
