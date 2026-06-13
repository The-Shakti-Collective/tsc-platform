# 11 — Storage

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Order** | 11 of 15 |

## Mission

Configure Cloudflare R2 for media uploads: S3-compatible client, bucket policies, API upload path, public URL strategy.

## Input

- [FOUNDER-TASKS.md](FOUNDER-TASKS.md) step 6
- `R2_*` env vars (MISSING locally)
- API storage/media modules

## Tasks

1. Document R2 credentials and bucket setup for founder.
2. Wire S3-compatible client in API using `@aws-sdk/client-s3` or existing adapter.
3. Implement presigned upload or server-side upload for avatar/media.
4. Configure `R2_PUBLIC_URL` or CDN for read access.
5. Add storage health probe (head bucket) to infra checks.
6. Validate CORS for browser uploads from Community.
7. Document ephemeral Render/Railway constraint — no local file persistence on prod.

## Verification commands

```powershell
Select-String -Path .env -Pattern "R2_" -ErrorAction SilentlyContinue
rg "R2_|S3Client|@aws-sdk" apps/api packages
pnpm --filter @tsc/api build
# When configured — use AWS CLI or script in deliverable
```

## Deliverable path

`.agents/reports/execution/11-storage.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Env documented | All `R2_*` vars in environment-matrix |
| Upload path | API endpoint or presign flow implemented |
| Read URL | Public or signed URL strategy documented |
| Health probe | Bucket reachable when keys set |
| Founder gap | Clear if step 6 incomplete |
