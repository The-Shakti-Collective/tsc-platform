---
name: phase-r0
description: Phase R0 backend stabilization — verify API typecheck, health, auth gate (code complete)
---

# Phase R0 — Backend Stabilization

**Status:** Code complete (2026-06-13). **Founder gate:** [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md)

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
http://localhost:4000/api/docs
```

**Next agent work:** P1 agents 06–07 after founder cutover. Do not re-implement R0 deliverables.
