# Cloudflare R2 — Asset Storage

**Never store uploads in Postgres.** Use R2 for user media, exports, and static assets.

## Setup

1. Cloudflare dashboard → **R2** → **Create bucket**
2. Buckets (recommended per environment):
   - `tsc-assets-dev`
   - `tsc-assets-staging`
   - `tsc-assets-prod`
3. **Manage R2 API tokens** → Create token:
   - Permission: **Object Read & Write**
   - Scope: target bucket(s)
4. Note **Account ID** for endpoint URL

## Railway env vars (tsc-api)

| Variable | Example (no secrets) |
|----------|----------------------|
| `R2_ACCESS_KEY_ID` | `<token access key>` |
| `R2_SECRET_ACCESS_KEY` | `<token secret>` |
| `R2_BUCKET` | `tsc-assets-staging` |
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | `https://assets.theshakticollective.in` |

## Custom domain (optional)

R2 → bucket → **Settings → Public access / Custom domain** → `assets.theshakticollective.in`

Add CNAME in Cloudflare DNS (proxied).

## CI secrets

Set org secrets: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`

Docs: [R2 get started](https://developers.cloudflare.com/r2/get-started/)
