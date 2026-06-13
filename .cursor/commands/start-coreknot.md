---
name: start coreknot
description: Start full CoreKnot stack — Docker infra + API :4000 + CoreKnot :3001.
---

# Start CoreKnot stack

One command: Docker infra + NestJS API + CoreKnot client.

```powershell
pnpm start:coreknot
```

Or:

```powershell
.\scripts\start-stack.ps1 -Target coreknot
```

**What starts**

1. Docker: Postgres + Redis (smart skip for Neon / remote Redis)
2. API in new terminal — http://localhost:4000/api (CORS http://localhost:3001)
3. CoreKnot client in new terminal — http://localhost:3001
