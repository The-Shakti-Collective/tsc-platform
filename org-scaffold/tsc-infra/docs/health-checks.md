# Health Checks

Canonical copy: `.agents/infra/health-checks.md`

## Railway (tsc-api)

- Path: `/health/ready`
- Timeout: 300s
- Config: `org-scaffold/tsc-api/railway.json`

## Scripts

```powershell
.\scripts\health-check.ps1 -Environment staging -Strict
```

```bash
./scripts/health-check.sh staging
```
