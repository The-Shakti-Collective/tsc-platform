# Environment Variable Matrix

Canonical copy: `.agents/infra/environment-matrix.md` in TSC Platform monorepo.

See that file for the full per-service matrix (no secret values).

Quick reference — **tsc-api (Railway)** required secrets:

- `DATABASE_URL`, `REDIS_URL`
- `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- `TYPESENSE_HOST`, `TYPESENSE_API_KEY`
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`

**Vercel frontends** required:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
