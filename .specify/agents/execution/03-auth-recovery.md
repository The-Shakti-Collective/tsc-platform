# 03 — Auth Recovery

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Order** | 3 of 15 |

## Mission

Align Clerk auth across API and frontends: valid keys **or** consistent stub bypass when `TSC_AUTH_STUB=true`.

## Input

- `.env` — `CLERK_*`, `TSC_AUTH_STUB`, `NEXT_PUBLIC_CLERK_*`
- `apps/api/src/` — `ClerkAuthGuard`, auth module
- `apps/community/` — Clerk provider, middleware
- [FOUNDER-TASKS.md](FOUNDER-TASKS.md) step 2

## Tasks

1. Audit env: flag `REPLACE_ME` keys and document founder action if real Clerk required.
2. Trace `ClerkAuthGuard` — ensure dev stub path matches `TSC_AUTH_STUB` when keys invalid.
3. Align Community layout/middleware with API auth expectations.
4. Verify CoreKnot client auth headers or stub mode.
5. Test protected API route locally with and without session.
6. Document RBAC integration with `@tsc/permissions` for at least one guarded endpoint.
7. Record prod auth as UNVERIFIED until agent 05 DNS passes.

## Verification commands

```powershell
Select-String -Path .env -Pattern "CLERK|TSC_AUTH" -ErrorAction SilentlyContinue
pnpm --filter @tsc/api build
pnpm dev:api
Invoke-RestMethod http://127.0.0.1:4000/api/feed/health
rg "ClerkAuthGuard|TSC_AUTH_STUB|StubAuth" apps/api apps/community
```

## Deliverable path

`.agents/reports/execution/03-auth-recovery.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Local API boot | No crash on auth module init |
| Stub or real keys | Documented path; no silent REPLACE_ME in runtime |
| Guard consistency | Stub flag honored OR valid Clerk keys set |
| Frontend | Community loads without auth provider crash |
