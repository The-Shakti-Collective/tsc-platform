---
name: platform-agents
description: TSC multi-agent operating model — 18 responsibility-based agents across Executive, Platform, Domain, Operations layers
---

# Platform agents

Entry: [AGENTS.md](../../AGENTS.md) · Registry: [multi-agent-hierarchy.md](.specify/agents/multi-agent-hierarchy.md)

## Invoke an agent

1. Open the layer doc for the agent's task checklist and output path.
2. Run checks listed there.
3. Fill the matching template in `.specify/agents/reports/templates/`.
4. Write report to `.agents/reports/<output-file>.md`.
5. End every report with the master status block.

| Layer | Doc | Agents |
|-------|-----|--------|
| Executive | [executive-layer.md](.specify/agents/executive-layer.md) | CTO (daily), Product Architect, Security |
| Platform | [platform-layer.md](.specify/agents/platform-layer.md) | Infrastructure, Backend, Frontend, Database, Graph, Intelligence |
| Domain | [domain-layer.md](.specify/agents/domain-layer.md) | Community, CoreKnot, Marketplace, Audience, Workspace |
| Operations | [operations-layer.md](.specify/agents/operations-layer.md) | QA, DevOps, Monitoring, Documentation |

## Sweeps

- Local: `/sweep-local` or `pnpm sweep:local`
- Production: `/sweep-prod` or `pnpm sweep:prod`
