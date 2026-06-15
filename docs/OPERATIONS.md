# TSC Platform — Operations

> Day-2 operations. Runbook incidents: [RUNBOOK.md](./RUNBOOK.md)

## Service map

| Service | URL (prod target) | Host | On-call probe |
|---------|-------------------|------|---------------|
| Platform API | api.theshakticollective.in | Railway | `/api/health/ready` |
| TSC Community | theshakticollective.in/community | Vercel | Page load |
| TSC Website | theshakticollective.in | Vercel | Page load |
| CoreKnot API | api.coreknot.in | Railway | `/api/health/ready` |
| CoreKnot Client | coreknot.in | Vercel | Page load |
| CoreKnot Workers | (internal) | Railway | Queue depth / worker logs |
| PostgreSQL | Neon console | Neon | Connection count |
| Redis | Upstash/Railway | Provider | PING |

## Observability

| Tool | Scope | Config |
|------|-------|--------|
| Sentry | Errors all apps | `SENTRY_DSN` |
| PostHog | Product analytics | `POSTHOG_*`, `VITE_POSTHOG_KEY` |
| BetterStack | Uptime heartbeat | `BETTERSTACK_HEARTBEAT_URL` (API) |

Setup detail: [coreknot-observability-setup.md](./coreknot-observability-setup.md) (aligned with shared stack).

## Sweeps

```powershell
pnpm sweep:local    # Dev stack health
pnpm sweep:prod     # Production URLs (requires env)
```

Agent runbooks: `.specify/agents/sweeps/`

## Database operations

| Task | Command | Who |
|------|---------|-----|
| Prisma migrate (dev) | `pnpm db:migrate` | Engineering |
| Migrate deploy (prod) | `prisma migrate deploy` in CI/Railway | DevOps + founder |
| CoreKnot ETL | `pnpm migrate:coreknot:p0:execute` | Engineering |
| Backup | Neon automatic PITR | Founder (Neon dashboard) |
| Legacy Mongo backup | CoreKnot cron (sunset) | Until Mongo removed |

## Queue operations

| Queue prefix | Owner | Worker |
|--------------|-------|--------|
| `tsc.*` | Platform API | Railway API process |
| CoreKnot mail/import | CoreKnot | Railway worker service |

Redis required in production for mail campaigns and Platform BullMQ.

## Secrets rotation

| Secret | Rotation | Location |
|--------|----------|----------|
| `CLERK_SECRET_KEY` | Clerk dashboard | Railway + Vercel |
| `JWT_SECRET` | CoreKnot redeploy | Railway CoreKnot (until Clerk) |
| Webhook secrets | Per integration | CoreKnot + Website env |
| `DATABASE_URL` | Neon reset | Railway both APIs |

## Access control

- **Founder:** Neon, Railway, Vercel, Cloudflare, Clerk org admin
- **Engineering:** GitHub org, read-only prod logs via Sentry
- **Staff:** CoreKnot app only — no infra console

## Architecture changes

All production architecture changes require updating [architecture/MASTER-PRODUCTION-ARCHITECTURE.md](./architecture/MASTER-PRODUCTION-ARCHITECTURE.md) first.

## Support escalation

1. Check Sentry for new issues
2. Run prod sweep
3. Check Railway/Vercel deploy logs
4. Neon status + connection limits
5. See [RUNBOOK.md](./RUNBOOK.md) for common failures
