---
name: fix-runtime
description: Run P0 Runtime Recovery — start API, Community, CoreKnot locally and verify health endpoints
---

# Runtime Recovery (Agent 04)

Restore local dev stack per [04-runtime-recovery.md](.specify/agents/execution/04-runtime-recovery.md).

```powershell
pnpm kill:ports
pnpm start:infra
docker compose ps
pnpm dev:api
```

Health probes:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/feed/health
pnpm dev:community
Invoke-RestMethod http://127.0.0.1:3000/api/health -ErrorAction SilentlyContinue
pnpm dev:coreknot
```

**Depends on:** Agents 02–03 non-blocking. Use `/fix-typecheck` and `/fix-auth` first if needed.

**Output:** `.agents/reports/execution/04-runtime-recovery.md` (gitignored; optional regen). Canonical status: [AGENTS.md](AGENTS.md), [.agents/MEMORY.md](.agents/MEMORY.md).

**Registry:** [execution-agents.md](.specify/agents/execution/execution-agents.md)
