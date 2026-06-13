---
name: start all
description: Start Docker infra + API :4000 + all frontends (3000, 3001, 3002).
---

# Start all stacks

One shared API with CORS for all frontends, plus Community, CoreKnot, and Website in separate terminals.

```powershell
pnpm start:all
```

Or:

```powershell
.\scripts\start-stack.ps1 -Target all
```

Opens 4 PowerShell windows. Close them to stop.
