# CoreKnot — deploy rollback

Quick reference when a CoreKnot production deploy misbehaves.

## API (Railway / Render)

1. **Redeploy previous image** — Railway/Render dashboard → Deployments → select last green deploy → Redeploy.
2. **Env rollback** — revert changed env vars (especially `MONGODB_URI_PROD`, `REDIS_URL`, store flags).
3. **Health** — `GET /api/health/live` (process up) vs `GET /api/health/ready` (Mongo/Redis healthy).

## Worker (mail campaigns)

1. Scale worker service to 0 to stop sends immediately.
2. Fix web API first; redeploy worker after Redis + DB confirmed.
3. Stuck campaigns: admin UI or `resumeStuckCampaigns` on worker restart.

## Postgres migration flags

If a domain flag flip caused bad reads:

```env
# Revert per-domain store to mongo (example)
COREKNOT_CRM_STORE=mongo
COREKNOT_AUTH_STORE=mongo
```

Redeploy API + worker. Data in Postgres remains; Mongo is read path again.

## Client (Vercel)

1. Vercel → Deployments → Promote previous production deployment.
2. If bad env: revert `VITE_*` / `RENDER_API_PROXY_URL` in project settings → Redeploy.

## DNS

Cloudflare → revert CNAME to prior target if domain change caused outage.

## When to escalate

- Data corruption suspected → stop writes, snapshot DB, contact founder.
- Mass mail misfire → stop worker, mark campaign `Stopped` in admin.

See also [coreknot-production-runbook.md](../../docs/coreknot-production-runbook.md).
