---
name: platform-report
description: Open latest consolidated TSC platform health report (all 18 agents)
---

# Platform report

Canonical status: [AGENTS.md](AGENTS.md) · [.agents/MEMORY.md](.agents/MEMORY.md)

Optional sweep outputs (gitignored): `.agents/reports/local-sweep-report.md`, `.agents/reports/production-sweep-report.md`

Re-run sweeps:

```powershell
pnpm sweep:local
pnpm sweep:prod
```

Then re-execute agent checklists from [platform-agents](platform-agents.md).
