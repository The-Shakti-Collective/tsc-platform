---
name: recovery-commander
description: Run P0 Platform Recovery Commander — triage blockers, sequence agents 02-05, write execution report
---

# Platform Recovery Commander (Agent 01)

Orchestrates P0 recovery per [01-platform-recovery-commander.md](.specify/agents/execution/01-platform-recovery-commander.md).

```powershell
pnpm sweep:local
pnpm sweep:prod
```

Review blockers and founder prerequisites:

```powershell
Get-Content AGENTS.md -Head 40
Get-Content .agents/MEMORY.md -Head 40
Get-Content .specify/agents/execution/FOUNDER-TASKS.md -Head 40
```

**Output:** `.agents/reports/execution/01-recovery-commander.md` (gitignored; optional regen) with agent assignments and NEXT PRIORITY. Canonical status: [AGENTS.md](AGENTS.md), [.agents/MEMORY.md](.agents/MEMORY.md).

**Registry:** [execution-agents.md](.specify/agents/execution/execution-agents.md) · **Founder tasks:** [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md)
