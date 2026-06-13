---
name: fix-typecheck
description: Run P0 API Typecheck Elimination — drive @tsc/api TS errors to zero
---

# API Typecheck Elimination (Agent 02)

Fix API TypeScript errors per [02-api-typecheck-elimination.md](.specify/agents/execution/02-api-typecheck-elimination.md).

Baseline error count:

```powershell
pnpm --filter @tsc/api typecheck
```

Build after fixes:

```powershell
pnpm --filter @tsc/api build
pnpm --filter @tsc/database build
pnpm --filter @tsc/contracts build
```

**Output:** `.agents/reports/execution/02-typecheck-status.md` with baseline → final error count.

**Registry:** [execution-agents.md](.specify/agents/execution/execution-agents.md)
