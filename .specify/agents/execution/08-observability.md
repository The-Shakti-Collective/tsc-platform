# 08 — Observability

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Order** | 8 of 15 |

## Mission

Wire production observability: PostHog (complete), Sentry error tracking, uptime checks — env vars and SDK integration in API + frontends.

## Input

- [FOUNDER-TASKS.md](FOUNDER-TASKS.md) step 8
- `apps/api/src/modules/analytics/posthog.service.ts`
- Partial PostHog on API + Website only (per master report)

## Tasks

1. Audit current PostHog coverage across Community, CoreKnot, API, Website.
2. Add Sentry SDK to API and primary frontends if DSN provided.
3. Configure BetterStack or equivalent uptime monitor for prod URLs.
4. Add structured logging fields for request ID / user ID where safe.
5. Verify events appear in PostHog project after local smoke.
6. Document alert routing (email/Slack) for founder.
7. Update environment-matrix with all monitoring env vars.

## Verification commands

```powershell
rg "posthog|PostHog|Sentry|sentry" apps packages
Select-String -Path .env -Pattern "POSTHOG|SENTRY" -ErrorAction SilentlyContinue
pnpm --filter @tsc/api build
pnpm --filter @tsc/community build
```

## Deliverable path

`.agents/reports/execution/08-observability.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| PostHog | Community + API events documented and testable |
| Sentry | Integrated OR explicitly MISSING with founder blocker |
| Uptime | Prod URLs on monitor checklist |
| Env matrix | All tokens documented (redacted) |
| No PII leaks | Report notes scrubbed fields in logs |
