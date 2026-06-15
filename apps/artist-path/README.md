# The Artist Path

Landing site for the TSC Artist Path accelerator — hosted at [theartistpath.in](https://theartistpath.in).

Part of the TSC Platform monorepo (`apps/artist-path`). Deployed from the standalone repo [The-Shakti-Collective/tsc-artist-path](https://github.com/The-Shakti-Collective/tsc-artist-path).

## Local dev

From monorepo root:

```bash
pnpm install
pnpm --filter @tsc/artist-path dev
```

Open [http://localhost:3010](http://localhost:3010).

## Application submissions

Apply CTAs link to the TSC Website wizard at `https://theshakticollective.in/artist-path`. That form posts to Platform API `POST /api/public/artist-path/applications`. Responses land in PostgreSQL (`ArtistPathApplication`) and show in CoreKnot Admin → Artist Path when `VITE_TSC_API_URL` points at the Platform API.

`/apply` on this site redirects to the main-site form.

**TSC Website (Vercel) env:**

| Variable | Purpose |
|----------|---------|
| `TSC_API_URL` | Platform API base, e.g. `https://api.theshakticollective.in/api` |
| `ARTIST_PATH_WEBHOOK_SECRET` | Must match Platform API `ARTIST_PATH_WEBHOOK_SECRET` |
| `NEXT_PUBLIC_ARTIST_PATH_URL` | Landing link, e.g. `https://theartistpath.in` |

**Platform API** also needs `TSC_DEFAULT_ORG_ID` and `ARTIST_PATH_WEBHOOK_SECRET`. Run migration `20250615000000_artist_path_applications` on Neon before prod submissions.

## Vercel deploy

1. Import `The-Shakti-Collective/tsc-artist-path` in Vercel.
2. Framework preset: Next.js (repo root — not monorepo).
3. Uses **npm** (`package-lock.json` + `vercel.json` installCommand). Do not use `pnpm install` on this standalone repo.
4. Optional env: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TSC_WEBSITE_URL`, `NEXT_PUBLIC_APPLY_URL`.
5. Add custom domain `theartistpath.in` (+ `www` if desired).

## TSC Website link

The main website links Artist Path to `https://theartistpath.in` via `NEXT_PUBLIC_ARTIST_PATH_URL`.
