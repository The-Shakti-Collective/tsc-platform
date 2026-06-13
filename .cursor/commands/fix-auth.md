---
name: fix-auth
description: Run P0 Auth Recovery — align Clerk keys or TSC_AUTH_STUB across API and frontends
---

# Auth Recovery (Agent 03)

Align authentication per [03-auth-recovery.md](.specify/agents/execution/03-auth-recovery.md).

Check env and guard wiring:

```powershell
Select-String -Path .env -Pattern "CLERK|TSC_AUTH" -ErrorAction SilentlyContinue
rg "ClerkAuthGuard|TSC_AUTH_STUB" apps/api apps/community
pnpm --filter @tsc/api build
```

**Founder prerequisite:** [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md) step 2 (Clerk keys).

**Output:** `.agents/reports/execution/03-auth-recovery.md` (gitignored; optional regen). Canonical status: [AGENTS.md](AGENTS.md), [.agents/MEMORY.md](.agents/MEMORY.md).

**Registry:** [execution-agents.md](.specify/agents/execution/execution-agents.md)
