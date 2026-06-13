---
name: sweep-prod
description: Run TSC production sweep — HTTP probes for API, Community, CoreKnot, infra. Writes production-sweep-report.md
---

# Production sweep

Runs automated prod probes per [production-sweep.md](.specify/agents/sweeps/production-sweep.md).

Set URLs first (or use defaults from env-vars):

```powershell
$env:TSC_API_URL = "https://your-api.railway.app"
$env:TSC_COMMUNITY_URL = "https://community.example.com"
$env:TSC_COREKNOT_URL = "https://coreknot.example.com"
pnpm sweep:prod
```

**Output:** `.agents/reports/production-sweep-report.md`

**Agent owners:** Infrastructure, Monitoring, DevOps, all Domain agents (see [multi-agent-hierarchy.md](.specify/agents/multi-agent-hierarchy.md)).
