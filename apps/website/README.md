# @tsc/website

Marketing site for The Shakti Collective (`theshakticollective.in`).

## Dev

```powershell
pnpm dev:website          # :3002
pnpm start:website        # infra + API + website
```

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_WEBSITE_URL` | Canonical site URL (SEO, sitemap) |
| `NEXT_PUBLIC_COMMUNITY_URL` | Community app link |
| `NEXT_PUBLIC_API_URL` | TSC API base (`http://localhost:4000/api`) |
| `TSC_PUBLIC_API_KEY` | Server-only public API key for `/discover` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Client + contact form analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingest host |

## Deploy

Vercel — see `vercel.json`. Health check: `GET /api/health`.
