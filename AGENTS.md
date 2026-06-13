# TSC Platform — Multi-Agent Operating Model

> Entry point for the platform-responsibility agent hierarchy.  
> Canonical definitions: [`.specify/agents/`](.specify/agents/multi-agent-hierarchy.md) · Architecture index: [`.specify/MASTER.md`](.specify/MASTER.md)

## Quick links

| Document | Purpose |
|----------|---------|
| [Multi-agent hierarchy](.specify/agents/multi-agent-hierarchy.md) | Layers, coordination, sweep workflows |
| [Executive layer](.specify/agents/executive-layer.md) | CTO, Product Architect, Security |
| [Platform layer](.specify/agents/platform-layer.md) | Infra, Backend, Frontend, Database, Graph, Intelligence |
| [Domain layer](.specify/agents/domain-layer.md) | Community, CoreKnot, Marketplace, Audience, Workspace |
| [Operations layer](.specify/agents/operations-layer.md) | QA, DevOps, Monitoring, Documentation |
| [Local environment sweep](.specify/agents/sweeps/local-environment-sweep.md) | Dev stack verification runbook |
| [Production sweep](.specify/agents/sweeps/production-sweep.md) | Prod health aggregation runbook |
| [Report templates](.specify/agents/reports/templates/) | Scaffold markdown for agent outputs |
| [Execution agents](.specify/agents/execution/execution-agents.md) | 15 remediation agents (P0 → P1 → P2) |
| [Founder tasks](.specify/agents/execution/FOUNDER-TASKS.md) | Secrets and provider setup agents cannot complete |

## Phase R0 — Backend Stabilization (code complete · 2026-06-13)

**Sprint status:** R0 **code work done** — typecheck 0, health endpoints, Swagger `/api/docs`, unified `ClerkAuthGuard`, observability scaffold, CI workflows, Railway config. **Production cutover** still blocked on founder tasks (Clerk keys, Neon/Redis prod URLs, GitHub push, Railway deploy, Cloudflare DNS).

**Gate:** No Community/CoreKnot/Marketplace feature work until founder completes [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md).

Agent continuity: [`.agents/MEMORY.md`](.agents/MEMORY.md) · Cursor rule: [`.cursor/rules/backend-stabilization-sprint.mdc`](.cursor/rules/backend-stabilization-sprint.mdc)

## Execution Agents

Remediation sprint agents — run in order after founder prerequisites where required.

| Phase | Agents | Cursor |
|-------|--------|--------|
| P0 Recovery | [01–05](.specify/agents/execution/execution-agents.md) | `/recovery-commander`, `/fix-typecheck`, `/fix-auth`, `/fix-runtime` |
| P1 Completion | [06–12](.specify/agents/execution/execution-agents.md) | — |
| P2 Hardening | [13–15](.specify/agents/execution/execution-agents.md) | — |

Complete [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md) (GitHub, Clerk, Cloudflare, Railway, Vercel, R2, Typesense, Monitoring) before agents that need prod secrets.

## Agent reports

Sweep and execution agents may write outputs to `.agents/reports/` (gitignored). Templates remain in [`.specify/agents/reports/templates/`](.specify/agents/reports/templates/). Do not treat removed execution status reports as canonical — use this file, `FOUNDER-TASKS.md`, and `.specify/`.

## Running sweeps

```powershell
# Local environment sweep (PowerShell)
pnpm sweep:local

# Production sweep (requires env URLs — see runbook)
pnpm sweep:prod
```

In Cursor: `/sweep-local`, `/sweep-prod`, or `/platform-agents` for the full registry.

## Hierarchy at a glance

```
Executive     → CTO · Product Architect · Security
Platform      → Infrastructure · Backend · Frontend · Database · Graph · Intelligence
Domain        → Community · CoreKnot · Marketplace · Audience · Workspace
Operations    → QA · DevOps · Monitoring · Documentation
```

18 agents across 4 layers. Each agent owns platform responsibilities — not individual repositories.
