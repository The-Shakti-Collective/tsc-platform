# Health Check Configuration

## Endpoints

| Service | Liveness | Readiness | Expected |
|---------|----------|-----------|----------|
| **tsc-api** | `GET /health` | `GET /health/ready` | 200 JSON `{ status: "ok" }` |
| **tsc-api** (prefixed) | `GET /api/health` | — | 404 (excluded from prefix) |
| **tsc-community** | `GET /api/health` | — | 200 |
| **tsc-coreknot** | `GET /health.json` | — | 200 static JSON |
| **tsc-web** | `GET /api/health` | — | 200 (add route on scaffold) |
| **tsc-docs** | `GET /` | — | 200 |

### tsc-api readiness checks

| Dependency | Required | Failure mode |
|------------|----------|--------------|
| PostgreSQL (`DATABASE_URL`) | Yes | HTTP 503, deploy fails |
| Redis (`REDIS_URL`) | Staging/prod | HTTP 503 if configured but unreachable |
| Redis absent | Dev only | `checks.redis: "degraded"`, still 200 |

---

## Platform configuration

### Railway (tsc-api)

File: `org-scaffold/tsc-api/railway.json`

```json
{
  "deploy": {
    "healthcheckPath": "/health/ready",
    "healthcheckTimeout": 300
  }
}
```

Railway dashboard: **Settings → Health Check Path** = `/health/ready`

### Vercel (frontends)

No built-in health path. Options:

1. **Deployment protection** — use `/api/health` in external uptime monitor
2. **Smoke script** — `org-scaffold/tsc-infra/scripts/health-check.ps1`

Recommended monitor intervals: 60s prod, 300s staging.

### Cloudflare

Optional **Health Checks** on origin URLs (paid). Minimum: external monitor hitting `/health/ready` on API.

---

## Local verification

```powershell
# API (after pnpm dev:api)
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/health/ready

# Community
Invoke-RestMethod http://localhost:3000/api/health

# CoreKnot client
Invoke-RestMethod http://localhost:3001/health.json
```

---

## CI smoke (post-deploy)

GitHub Actions step (add to deploy job):

```yaml
- name: Smoke health
  run: |
    curl -fsS "${{ vars.API_URL }}/health/ready"
    curl -fsS "${{ vars.COMMUNITY_URL }}/api/health"
```

Set `API_URL` and `COMMUNITY_URL` as GitHub Environment variables per staging/production.
