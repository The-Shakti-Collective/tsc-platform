---
name: coreknot
description: Start CoreKnot dev stack (infra + API :4000 + client :3001). Prefer /start coreknot.
---

# CoreKnot dev stack

**Full stack (infra + API + frontend):**

```powershell
pnpm start:coreknot
```

**Frontend only** (infra already running):

```powershell
pnpm dev:stack:coreknot
```

CoreKnot client is a Vite stub until Stage 2 wiring — API on http://localhost:4000/api with CORS for http://localhost:3001.
