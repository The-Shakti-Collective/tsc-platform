# TSC Platform — Deployment

> Production deployment guide. Detail: [architecture/DEPLOYMENT-ARCHITECTURE.md](./architecture/DEPLOYMENT-ARCHITECTURE.md)

## Pre-deploy checklist

- [ ] [FOUNDER-TASKS.md](../.specify/agents/execution/FOUNDER-TASKS.md) Steps 1–5 complete
- [ ] `pnpm ci` passes on `main`
- [ ] Neon `DATABASE_URL` set in Railway
- [ ] Redis `REDIS_URL` set for APIs with queues
- [ ] Clerk production keys in Vercel + Railway
- [ ] Cloudflare DNS records configured

## Platform API (Railway)

1. Create Railway project; connect `tsc-platform` repo
2. **Root directory:** repository root (not `apps/api`)
3. Config: `/railway.json`, `/nixpacks.toml`
4. Start: `node scripts/railway-start.mjs`
5. Health: `GET /api/health/live`
6. Env: copy from `.env.platform.example` + `.env.shared.example`
7. Custom domain: `api.theshakticollective.in`

## TSC Community + Website (Vercel)

| Project | Root directory | Domain |
|---------|----------------|--------|
| tsc-community | `apps/community` | `theshakticollective.in/community` |
| tsc-website | `apps/website` | `theshakticollective.in` |

Install command (in `vercel.json`): `cd ../.. && pnpm install --frozen-lockfile`

Env: `NEXT_PUBLIC_API_URL=https://api.theshakticollective.in/api`, Clerk keys.

## CoreKnot (Vercel + Railway)

**Client (Vercel):** root `apps/coreknot/client`, domain `coreknot.in`

**API (Railway):** root `apps/coreknot/server`

| Service | Start | Env |
|---------|-------|-----|
| coreknot-api | `node server.js` | `RUN_WORKERS=false` |
| coreknot-workers | `node workers/startWorkers.js` | `RUN_WORKERS=true`, `REDIS_URL` required |

Domain: `api.coreknot.in`

**Do not use Render** for new deploys. Legacy blueprint archived at [archive/render.coreknot.legacy.yaml](./archive/render.coreknot.legacy.yaml).

## CoreKnot Postgres cutover

Before removing Mongo from Railway env:

1. Run ETL: `pnpm migrate:coreknot:p0:execute`
2. Set `COREKNOT_*_STORE=postgres` flags
3. Parallel-run 30 days — [migration/PRODUCTION-CUTOVER.md](./migration/PRODUCTION-CUTOVER.md)
4. Parity: `pnpm migrate:coreknot:count-parity`
5. Set `COREKNOT_MONGO_REQUIRED=false`

## Post-deploy verification

```powershell
pnpm sweep:prod
```

Or manually:

- `GET https://api.theshakticollective.in/api/health/ready`
- `GET https://api.coreknot.in/api/health/ready`
- Load Community, Website, CoreKnot client

## Rollback

- **Vercel:** Dashboard → Deployments → Promote previous
- **Railway:** Redeploy previous deployment
- **Database:** Neon point-in-time restore (founder)

See `org-scaffold/tsc-infra/docs/rollback-strategy.md`.

## OpenAPI publish

```bash
pnpm openapi:export
# Ship apps/api/openapi/tsc-api.openapi.json to tsc-docs repo
```
