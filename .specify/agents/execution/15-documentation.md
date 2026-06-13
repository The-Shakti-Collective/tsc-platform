# 15 — Documentation

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Order** | 15 of 15 |

## Mission

Fix documentation drift: package counts, auth guard references, architecture accuracy, execution agent cross-links.

## Input

- [documentation-health.md](../../../.agents/reports/documentation-health.md)
- Stale StubAuthGuard references; wrong package counts
- New execution agent docs in `.specify/agents/execution/`

## Tasks

1. Audit README, AGENTS.md, system-overview for stale metrics.
2. Replace StubAuthGuard references with current ClerkAuthGuard / stub path.
3. Update package and module counts to match repo (`pnpm -r list`).
4. Add execution agents section cross-links where missing.
5. Verify `.env.example` covers all FOUNDER-TASKS variables.
6. Add OpenAPI spec task or stub pointer if still MISSING.
7. Refresh MASTER-PLATFORM-REPORT NEXT PRIORITY after P0–P2 completion.

## Verification commands

```powershell
rg "StubAuthGuard|18 packages|REPLACE_ME" .specify AGENTS.md README.md
pnpm -r list --depth -1
Test-Path .env.example
Get-ChildItem .specify/agents/execution/*.md | Measure-Object
```

## Deliverable path

`.agents/reports/execution/15-documentation.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Drift items | All items from documentation-health addressed or deferred with ticket |
| Auth docs | Match agent 03 implementation |
| Env example | Covers Clerk, R2, Typesense, PostHog, Sentry vars |
| Counts accurate | Package/module numbers match repo |
| Links | execution-agents.md linked from AGENTS.md |
