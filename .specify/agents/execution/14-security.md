# 14 — Security

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Order** | 14 of 15 |

## Mission

Address security debt: npm audit findings, rate limiting, prod auth verification, secrets hygiene.

## Input

- [security-report template](../reports/templates/security-report.md) (output: `.agents/reports/security-report.md`, gitignored)
- 5 npm audit findings (1 critical, 1 high — dev deps)
- No rate limiting on API
- Agent 03 auth + agent 05 prod status

## Tasks

1. Run `pnpm audit` and triage critical/high — patch or document accept risk.
2. Add API rate limiting middleware (global or auth routes).
3. Verify Clerk JWT validation on prod after DNS recovery.
4. Scan for committed secrets: `rg` patterns for keys in repo.
5. Review CORS and helmet/security headers in `main.ts`.
6. Validate webhook signature verification for Clerk if enabled.
7. Update security report with remediation status.

## Verification commands

```powershell
pnpm audit
pnpm audit --prod
rg "sk_live|sk_test_|REPLACE_ME|api_key" --glob "!node_modules" .
pnpm --filter @tsc/api build
curl.exe -s -I https://api.theshakticollective.in/api/feed/health
```

## Deliverable path

`.agents/reports/execution/14-security.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Audit | Critical/high resolved or documented with CVE + plan |
| Rate limit | Middleware present on API |
| Secrets | No live keys in git |
| Prod auth | JWT path verified OR blocked on founder task |
| Headers | CORS + security headers documented |
