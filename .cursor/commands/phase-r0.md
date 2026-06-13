---
name: phase-r0
description: Phase R0 backend stabilization — API typecheck, health, auth, backend-done gate (10/15 green)
---

# Phase R0 — Backend Stabilization

**Gate checklist:** [BACKEND-DONE-CHECKLIST.md](.agents/reports/execution/BACKEND-DONE-CHECKLIST.md)

Verify API:

```powershell
pnpm --filter @tsc/api typecheck
pnpm --filter @tsc/api build
pnpm dev:api
```

Health probes:

```text
http://localhost:4000/api/health
http://localhost:4000/api/health/live
http://localhost:4000/api/health/ready
http://localhost:4000/api/feed/health
```

**Next:** Stage 6 Swagger at `/api/docs`. **Founder:** Clerk keys + Railway + Cloudflare per [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md).
