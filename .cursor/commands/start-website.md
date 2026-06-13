---
name: start website
description: Start full Website stack — Docker infra + API :4000 + Website :3002.
---

# Start Website stack

One command: Docker infra + NestJS API + Website frontend stub.

```powershell
pnpm start:website
```

Or:

```powershell
.\scripts\start-stack.ps1 -Target website
```

**What starts**

1. Docker: Postgres + Redis (smart skip for Neon / remote Redis)
2. API in new terminal — http://localhost:4000/api (CORS http://localhost:3002)
3. Website stub in new terminal — http://localhost:3002

When `apps/website` is wired into the monorepo, this will launch the real Vite/Next app.
