# 05 — DNS & Production Recovery

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Order** | 5 of 15 |

## Mission

Restore production reachability: DNS for `api`, `community`, `coreknot`; Railway API and Vercel frontends return healthy HTTP.

## Input

- [FOUNDER-TASKS.md](FOUNDER-TASKS.md) steps 3–5 (Cloudflare, Railway, Vercel)
- [production-sweep-report.md](../../../.agents/reports/production-sweep-report.md)
- Target URLs: `api.theshakticollective.in`, `community.theshakticollective.in`, `coreknot.theshakticollective.in`

## Tasks

1. Confirm founder completed Cloudflare DNS records (CNAME targets documented).
2. Verify Railway service deploy status and custom domain binding for API.
3. Verify Vercel projects and domain attachment for each frontend.
4. Run prod probes: health endpoints per subdomain.
5. Diagnose root domain HTTP 422 on `theshakticollective.in` — Vercel config or routing.
6. Validate prod env vars match `.agents/infra/environment-matrix.md`.
7. Re-run `pnpm sweep:prod` and diff against prior report.
8. Document SSL/TLS and CORS_ORIGIN for prod API.

## Verification commands

```powershell
pnpm sweep:prod
Resolve-DnsName api.theshakticollective.in -ErrorAction SilentlyContinue
curl.exe -fsS -o NUL -w "%{http_code}" https://api.theshakticollective.in/api/feed/health
curl.exe -fsS -o NUL -w "%{http_code}" https://community.theshakticollective.in
curl.exe -fsS -o NUL -w "%{http_code}" https://coreknot.theshakticollective.in
curl.exe -fsS -I https://theshakticollective.in
```

## Deliverable path

`.agents/reports/execution/05-dns-production.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| DNS | `api`, `community`, `coreknot` resolve |
| API prod | Health endpoint HTTP 200 |
| Frontends | HTTP 200 (not connection refused / NXDOMAIN) |
| Root domain | 422 resolved or documented with fix plan |
| Sweep | production-sweep-report upgraded vs baseline |
