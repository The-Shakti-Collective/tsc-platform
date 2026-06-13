---
name: start community
description: Start full Community stack — Docker infra + API :4000 + Community :3000.
---

# Start Community stack

One command: Docker infra (Postgres/Redis as needed) + NestJS API + Community frontend.

```powershell
pnpm start:community
```

Or:

```powershell
.\scripts\start-stack.ps1 -Target community
```

**What starts**

1. Docker: Postgres + Redis (skipped if `.env` uses Neon / remote Redis)
2. API in new terminal — http://localhost:4000/api
3. Community in new terminal — http://localhost:3000

**Flags**

```powershell
.\scripts\start-stack.ps1 -Target community -SkipInfra
.\scripts\start-stack.ps1 -Target community -KillPorts
```
