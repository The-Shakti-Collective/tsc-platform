# Railway — tsc-api

Templates: `tsc-api.staging.json`, `tsc-api.prod.json`

## Services

| Service | Branch | Domain | Health path |
|---------|--------|--------|-------------|
| `tsc-api-staging` | `develop` | `api-staging.theshakticollective.in` | `/health/ready` |
| `tsc-api-prod` | `main` | `api.theshakticollective.in` | `/health/ready` |

## Deploy

```powershell
$env:RAILWAY_TOKEN = '<token>'
$env:RAILWAY_SERVICE_ID_STAGING = '<service-id>'
.\scripts\deploy-api.ps1 -Environment staging -Migrate
```

## Rollback

```powershell
.\scripts\rollback-railway.ps1 -Environment staging
```

## Required env vars

See `docs/environment-matrix.md` — set in Railway dashboard, never in git.
