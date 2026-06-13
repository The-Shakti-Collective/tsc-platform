---
name: platform-report
description: Open latest consolidated TSC platform health report (all 18 agents)
---

# Platform report

Latest master report: [`.agents/reports/MASTER-PLATFORM-REPORT.md`](.agents/reports/MASTER-PLATFORM-REPORT.md)

Per-agent reports in the same folder. Re-run sweeps:

```powershell
pnpm sweep:local
pnpm sweep:prod
```

Then re-execute agent checklists from [platform-agents](platform-agents.md).
