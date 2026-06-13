# 09 — QA Automation

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Order** | 9 of 15 |

## Mission

Introduce Playwright E2E smoke suite and CI job for critical paths: health, auth gate, feed load.

## Input

- Agent 04 runtime green
- `.github/workflows/` existing CI
- No Playwright today (MISSING per master report)

## Tasks

1. Scaffold Playwright in monorepo root or `apps/community/e2e/`.
2. Add smoke tests: API health, Community home, optional CoreKnot health.
3. Configure `webServer` or document manual `pnpm start:community` for local runs.
4. Add GitHub Actions workflow job for E2E (or nightly).
5. Document flake handling and stub-auth test user strategy.
6. Integrate with agent 07 flows (feed, post) as tests stabilize.
7. Record pass/fail baseline in deliverable.

## Verification commands

```powershell
pnpm exec playwright --version
pnpm exec playwright test --list
pnpm exec playwright test
pnpm sweep:local
Get-ChildItem .github/workflows/*.yml
```

## Deliverable path

`.agents/reports/execution/09-qa-automation.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Playwright installed | Config + at least 3 smoke tests |
| Local run | `playwright test` passes against dev stack |
| CI | Workflow file runs tests or documents trigger |
| Coverage | Health + one authenticated or stub path |
| Report | Test list + last run result |
