# @tsc/website

Static marketing site for **theshakticollective.in** — Vite multi-page app (HTML + vanilla JS).

## Dev

```powershell
pnpm --filter @tsc/website dev
# http://localhost:3002
```

## Build

```powershell
pnpm --filter @tsc/website build
# Output: apps/website/dist/
```

Build steps:

1. `tsx scripts/export-site-data.mjs` — JSON from `lib/*.ts`
2. `node scripts/generate-pages.mjs` — HTML shells from templates
3. `vite build` — MPA bundle

## Forms

Browser → same-origin `/api/*` (Vercel serverless) → Platform API `public/website/*` → CoreKnot webhooks.

Copy [`apps/website/.env.example`](.env.example) to `.env.local` for local API proxy secrets.

## Deploy

Vercel project root: `apps/website`. `vercel.json` sets `outputDirectory: dist` and keeps `/community` proxy rewrites.
