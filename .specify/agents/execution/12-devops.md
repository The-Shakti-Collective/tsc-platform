# 12 — DevOps

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Order** | 12 of 15 |

## Mission

Harden CI/CD: verify 6 GitHub workflows run, deploy pipelines for Railway/Vercel, env sync, git/gh on PATH.

## Input

- `.github/workflows/` (6 workflow files)
- [FOUNDER-TASKS.md](FOUNDER-TASKS.md) steps 1, 4, 5
- Agent 05 prod recovery status

## Tasks

1. List workflows and expected triggers; run or inspect latest via `gh run list`.
2. Fix git/gh PATH issue on Windows dev host for sweep scripts.
3. Align CI jobs with agent 02 typecheck (must pass in pipeline).
4. Document Railway build/start commands and Vercel project settings.
5. Add or fix deploy preview for PRs where missing.
6. Sync `.agents/infra/environment-matrix.md` with prod env var names.
7. Produce deployment runbook section in deliverable.

## Verification commands

```powershell
Get-ChildItem .github/workflows/*.yml | Select-Object Name
git --version
gh run list --limit 5
pnpm --filter @tsc/api typecheck
pnpm --filter @tsc/community build
pnpm sweep:local
```

## Deliverable path

`.agents/reports/execution/12-devops.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Workflows | All 6 documented with pass/fail status |
| Typecheck in CI | Fails build on API TS errors |
| gh/git | Available on sweep host OR documented workaround |
| Deploy docs | Railway + Vercel steps reproducible |
| Env matrix | Matches prod variable names |
