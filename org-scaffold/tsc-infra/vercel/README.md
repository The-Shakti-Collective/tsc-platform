# Vercel project templates

Copy the matching JSON to each repo as `vercel.json`:

| File | Repo | Domain |
|------|------|--------|
| `tsc-web.json` | tsc-web | `theshakticollective.in` |
| `tsc-community.json` | tsc-community | `community.theshakticollective.in` |
| `tsc-coreknot.json` | tsc-coreknot | `coreknot.theshakticollective.in` |
| `tsc-docs.json` | tsc-docs | `docs.theshakticollective.in` |

For CoreKnot Vite SPA, also copy `api-health.js` → `api/health.js` in repo root.

## Deploy

```powershell
$env:VERCEL_TOKEN = '<token>'
$env:VERCEL_PROJECT_ID_COMMUNITY = '<project-id>'
.\scripts\deploy-vercel.ps1 -Project community -Environment staging
```

## Org secrets (CI)

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_*`
