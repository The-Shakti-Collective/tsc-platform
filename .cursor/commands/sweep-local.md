---
name: sweep-local
description: Run TSC local environment sweep — infra, apps, packages, CI. Writes .agents/reports/local-sweep-report.md
---

# Local environment sweep

Runs the automated local probe per [local-environment-sweep.md](.specify/agents/sweeps/local-environment-sweep.md).

```powershell
pnpm sweep:local
```

Skip builds (faster):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sweep-local.ps1 -SkipBuild
```

**Output:** `.agents/reports/local-sweep-report.md` with WORKING / PARTIAL / BROKEN / MISSING / NEXT PRIORITY.

**Agent owners:** Infrastructure, Backend, Frontend, DevOps (see [platform-layer.md](.specify/agents/platform-layer.md)).
