# 06 — CoreKnot File Storage Migration

> **Scope:** Legacy CoreKnot Express server (`apps/coreknot/server/`), client upload helpers (`apps/coreknot/client/src/utils/uploadthing.js`), target `@tsc/api` media module.  
> **Agent:** 7 — File Storage Migration  
> **Date:** 2026-06-14

---

## Executive summary

| Storage backend | Role today | User-facing? | Migration target |
|-----------------|------------|:------------:|------------------|
| **UploadThing** | Finance docs, mail template images, generic image/document upload via `/api/uploadthing` | Yes | **Cloudflare R2** via `@tsc/api` media module |
| **Local disk (`uploads/`)** | Campaign email attachments, CRM CSV imports, TSC Data Hub imports | Partial (attachments yes; imports transient) | R2 for durable attachments; direct-to-API upload for imports |
| **Mongo GridFS** | Daily DB backup archives (`backup_archives` bucket in `MONGODB_BACKUP_DB`) | No | Keep until Supabase backup primary; optional R2 cold archive (P2) |
| **Supabase Storage** | Compressed NDJSON collection dumps (`SUPABASE_BACKUP_BUCKET`) | No | **Out of scope** for user media — evaluate separately vs Neon/R2 for ops backups |

**Critical constraint:** Render/Railway filesystem is **ephemeral**. Local `uploads/campaign-attachments/` on prod is lost on redeploy unless persisted to object storage — campaign attachments are a **P0 migration** risk.

**Target env:** `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL` (see `apps/api/.env.example`, `org-scaffold/tsc-infra/cloudflare/r2-setup.md`).

---

## Audit — legacy storage surfaces

### 1. UploadThing (primary user media)

| Item | Location |
|------|----------|
| Express router | `config/uploadthing.js` — `imageUploader`, `documentUploader`, `mailTemplateImageUploader`, `financeDocUploader` |
| HTTP mount | `app/registerRoutes.js` → `POST /api/uploadthing/*` (rate-limited) |
| Server-side UTApi | `utils/uploadthingServer.js` — multer buffer → `UTFile` → `utapi.uploadFiles` |
| Finance multer → UT | `routes/financeRoutes.js` → `controllers/financeController.js` (`uploadFile`, `uploadFilesMany`, delete via `utapi.deleteFiles`) |
| Mongo fields | `models/FinanceDocument.js` — `fileUrl`, `fileKey`; nested `metadata.attachments[]` |
| Client | `client/src/utils/uploadthing.js`, `mailTemplateImageUpload.js`, `FinancePage.jsx`, `UploadDocumentModal.jsx`, `InvoiceTab.jsx` |
| Import scripts | `scripts/importInvoices.js`, `scripts/importBasecampInvoices.js` |
| Env | `UPLOADTHING_TOKEN` (base64 JSON with `apiKey`) or `UPLOADTHING_SECRET`; client `VITE_UPLOADTHING_URL` |

**URL shapes observed:** `https://utfs.io/f/{key}`, `ufsUrl` from UTApi responses.

**Auth gap:** UploadThing middleware only checks cookie/JWT presence (`requireAuthenticatedUpload`) — does not bind uploads to tenant/user id in metadata.

---

### 2. Local disk uploads

| Path | Handler | Persistence | Notes |
|------|---------|-------------|-------|
| `uploads/campaign-attachments/` | `domains/mail/routes/campaignApiRouter.js` → `campaignApiController.uploadAttachment` | **Durable on disk until redeploy** | `Campaign.attachments[].storageKey`; loaded by `utils/campaignAttachments.js` at dispatch |
| `uploads/` (flat) | `routes/tscRoutes.js` — TSC Data Hub CSV/XLS | Transient import staging | `tsc-{timestamp}-{originalname}` |
| `uploads/` (multer dest) | `domains/crm/routes.js` — lead/artist CSV upload | Transient | Parsed then discarded from disk |

**Ephemeral prod risk:** Campaign attachments stored only on Render disk — **must move to R2 before Railway cutover** or attachment sends will 404 after deploy.

---

### 3. Mongo GridFS (database backups — not user files)

| Item | Location |
|------|----------|
| Service | `services/databaseBackupService.js` |
| Bucket name | `backup_archives` in `MONGODB_BACKUP_DB` (default `taskmaster_backups`) |
| Metadata | `backup_snapshots` collection; filenames `{snapshotDate}/{collectionName}.json.gz` |
| Cron | `scripts/backupDaily.js`, Render cron via `config/adminScriptsCatalog.js` |
| Purge | `purgeAllMongoGridFsBackups` after successful Supabase backup |
| Ops scripts | `scripts/testBackupNow.js`, `scripts/atlasStorageCleanup.js`, `scripts/verifySupabaseBackup.js` |

GridFS stores **gzip-compressed Mongo collection exports**, not finance PDFs or mail images. Do not conflate with UploadThing migration.

---

### 4. Supabase Storage (secondary backup mirror)

| Item | Location |
|------|----------|
| Config | `config/supabase.js` — `SUPABASE_BACKUP_BUCKET` |
| Writer | `services/supabase/backupStore.js` — `exportCollectionToSupabase`, path `{snapshotDate}/{collectionName}.json.gz` |
| Destination switch | `BACKUP_DESTINATION=supabase|mongo|both` in `.env.example` |
| Worker | `workers/supabaseSyncWorker.js` (logs/rollup — separate from backup bucket) |

Supabase backup objects are **ops/DR**, not served to users. No CDN mapping required for product URLs.

---

## File count & size estimates — approach

Run **before** cutover to size R2 bucket, migration window, and egress budget. No production inventory was executed in this audit (founder Atlas/UploadThing access required).

### Phase A — Mongo URL inventory (UploadThing-backed)

```javascript
// scripts/migration/inventory-uploadthing-urls.js (Wave 2 deliverable)
const domains = ['utfs.io', 'uploadthing.com', 'ufs.sh'];
const filter = {
  $or: [
    { fileUrl: { $regex: domains.join('|'), $options: 'i' } },
    { 'metadata.attachments.fileUrl': { $regex: domains.join('|'), $options: 'i' } },
  ],
  isFolder: { $ne: true },
};
// FinanceDocument.countDocuments(filter)
// aggregate: { $group: { _id: null, n: { $sum: 1 }, bytes: { $sum: '$fileSize' } } }
```

Also scan: `User.avatar`, `NewsletterArticle.imageUrl` for external URLs (may include UploadThing).

### Phase B — UploadThing API listing (ground truth)

Use `UTApi.listFiles()` (v7) paginated — compare keys against Mongo `fileKey` set. Report orphans (UT without DB) and ghosts (DB without UT).

### Phase C — Local disk inventory (Render SSH or one-off job)

```powershell
# On legacy host (if accessible)
Get-ChildItem -Recurse apps/coreknot/server/uploads -File |
  Measure-Object -Property Length -Sum |
  Select-Object Count, @{N='SizeGB';E={[math]::Round($_.Sum/1GB,2)}}
```

Cross-check `MailCampaign` / `Campaign` documents: count `attachments.storageKey` vs files present on disk.

### Phase D — GridFS / Supabase backup sizing (ops only)

Reuse existing helpers:

```powershell
cd apps/coreknot/server
node scripts/testBackupNow.js   # prints gridfsCompressedBytes, gridfsFileCount
# Supabase: query backup_files.total_bytes via supabase admin or REST
```

### Phase E — Sample download validation

Stratified sample (e.g. 50 finance docs): `HEAD`/`GET` each `fileUrl`, record status, `Content-Length`, latency. Fail threshold >1% 404 → block cutover.

**Estimate worksheet (fill at inventory time):**

| Source | File count | Raw bytes | Compressed / notes |
|--------|----------:|----------:|--------------------|
| UploadThing (Mongo refs) | — | — | Sum `fileSize` where set |
| UploadThing (API list) | — | — | UT dashboard |
| Campaign attachments (disk) | — | — | Ephemeral on Render |
| GridFS backups | — | — | From `testBackupNow.js` |
| Supabase backup bucket | — | — | From `backup_files` metadata |

---

## UploadThing → Cloudflare R2 migration strategy

### Target architecture

```
Client → @tsc/api POST /api/media/presign → R2 PUT (browser or server)
       → POST /api/media/complete (register key + public URL in Mongo/Postgres)
Legacy → compatibility shim: /api/uploadthing/* proxies to media module during dual-run
```

Scaffold: `apps/api/src/modules/media/` — `R2StorageService` (S3-compatible), presigned PUT, public URL builder.

### Key layout (recommended)

```
{tenantId}/{domain}/{yyyy}/{uuid}-{sanitized-filename}
```

| Domain prefix | Legacy source |
|---------------|---------------|
| `finance/` | `financeDocUploader`, finance multer routes |
| `mail/` | `mailTemplateImageUploader` |
| `campaigns/` | Local campaign attachments |
| `imports/` | CRM/TSC transient (optional TTL lifecycle rule) |

### Migration waves

| Wave | Action | Downtime |
|------|--------|----------|
| **W2.1** | Founder: R2 bucket + `R2_*` on Railway; media module presign live | None |
| **W2.2** | **Dual-write:** new uploads → R2; keep UploadThing keys for rollback | None |
| **W2.3** | **Backfill:** copy UT objects → R2; update `fileUrl` + new `storageKey` (keep `fileKey` in `legacyFileKey` field during transition) | None (background job) |
| **W2.4** | Client: replace `@uploadthing/react` with presign + PUT in `uploadthing.js` shim (same export surface) | None |
| **W2.5** | Campaign attachments: upload to R2 at attach time; migrate existing disk files | None |
| **W3** | Read path: prefer R2 URL; fallback UT URL for unmigrated rows | None |
| **W4** | Disable UploadThing router; remove `UPLOADTHING_*` env | None |

### Backfill job sketch

1. Cursor `FinanceDocument` where `fileUrl` matches UT host and `migratedToR2 != true`.
2. `GET fileUrl` → stream to `R2StorageService.uploadObject(key, body, contentType)`.
3. Update: `fileUrl`, `fileKey` (R2 key), `legacyFileKey`, `legacyFileUrl`, `migratedToR2: true`.
4. Idempotent on key — skip if HEAD R2 exists.
5. Rate-limit: ~5–10 concurrent, exponential backoff on 429/503.

### Dual-write flag

```bash
STORAGE_PROVIDER=dual   # both UT + R2 on upload (Wave 2 only)
STORAGE_PROVIDER=r2     # R2 only
STORAGE_PROVIDER=uploadthing  # rollback
```

Implement in Wave 2 compatibility layer (`apps/api` or legacy adapter) — not enabled in prod until R2 keys verified.

---

## CDN URL mapping

### Public read model

| Layer | URL |
|-------|-----|
| R2 custom domain (recommended) | `https://assets.theshakticollective.in/{key}` |
| R2 dev/staging | `https://assets-staging.theshakticollective.in/{key}` or raw `R2_PUBLIC_URL` |
| Legacy UploadThing | `https://utfs.io/f/{fileKey}` |

Configure in Cloudflare: R2 bucket → **Custom domain** → CNAME `assets.theshakticollective.in` (proxied). Set `R2_PUBLIC_URL=https://assets.theshakticollective.in` on Railway.

### URL rewrite rules (backfill + runtime)

| From (legacy) | To (R2) |
|---------------|---------|
| `https://utfs.io/f/{key}` | `{R2_PUBLIC_URL}/coreknot/finance/{mappedKey}` |
| `https://*.ufs.sh/...` | Same mapping table |
| Relative `/uploads/campaign-attachments/{storageKey}` | `{R2_PUBLIC_URL}/coreknot/campaigns/{storageKey}` |

**DB strategy:** Store canonical **`storageKey`** (R2 object key) + **`fileUrl`** (computed from `R2_PUBLIC_URL`). Avoid storing only full URLs — simplifies domain changes.

**OCR / server fetch:** `financeController.js` and `reparseFinanceOcr.js` use `axios.get(fileUrl)` — R2 public URLs must allow server-side GET (public bucket or signed GET with TTL for private bucket).

**CORS:** Allow `PUT` from `coreknot.in`, `theshakticollective.in`, Vercel preview origins on R2 bucket CORS policy (see `org-scaffold/tsc-infra/cloudflare/r2-setup.md`).

### Content-Type & cache headers

Set on upload: `Content-Type` from client, `Cache-Control: public, max-age=31536000, immutable` for content-addressed keys (uuid in path).

---

## Rollback plan

### Triggers

- >1% upload failure rate for 15 minutes post-cutover
- >5% 404 on finance `fileUrl` in sample audit
- R2 auth/billing outage with no ETA

### Rollback steps (ordered)

1. Set `STORAGE_PROVIDER=uploadthing` on API + legacy server (if dual-running).
2. Re-enable `/api/uploadthing` route on legacy Express (keep disabled in git until W4 — feature flag only).
3. Point client `VITE_UPLOADTHING_URL` back to legacy host (`https://taskmaster-jfw0.onrender.com/api/uploadthing` or Railway proxy).
4. **Do not delete** R2 backfill copies — dual URLs remain valid during investigation.
5. Pause backfill worker; leave `legacyFileUrl` populated for rows already migrated.
6. Notify: finance OCR and invoice submit flows use UT URLs again.

### Data safety during rollback

| Data | Rollback impact |
|------|-----------------|
| Files uploaded to R2 during dual-write | Still readable if `R2_PUBLIC_URL` live; new uploads go to UT only |
| Rows backfilled to R2 URLs | Keep both URLs in DB until W4 sign-off |
| Campaign attachments migrated to R2 | Re-upload from R2 to disk **not** required if R2 URLs stored on campaign doc |

### GridFS / Supabase rollback (ops backups)

Independent of user media. If Supabase backup fails, `BACKUP_DESTINATION=mongo` restores GridFS-only path (`databaseBackupService.js` already supports `both`).

---

## Target module map (`@tsc/api`)

| Legacy | Target |
|--------|--------|
| `config/uploadthing.js` | `media.controller.ts` — presign + complete |
| `utils/uploadthingServer.js` | `r2-storage.service.ts` — server-side upload/delete |
| `GET /api/health/storage` (new) | Extend `health.service.ts` or media readiness |
| Finance `fileKey` / `fileUrl` | Prisma `FinanceDocument` equivalent (Agent 3) + same field names for adapter |

**Scaffold added:** `apps/api/src/modules/media/` — `R2StorageService`, `MediaService`, `MediaController` (`/api/media/readiness`, `/api/media/presign`).

Wire `MediaModule` in `app.module.ts`. Run `pnpm install` after adding `@aws-sdk/client-s3`.

---

## Verification checklist (Wave 2 exit)

- [ ] Founder `R2_*` set on Railway staging
- [ ] `GET /api/media/readiness` → `configured: true`
- [ ] Presign → PUT 10MB PDF → public GET 200
- [ ] Finance upload E2E via client shim
- [ ] Campaign attachment survives API redeploy (R2-backed)
- [ ] Inventory worksheet completed; backfill dry-run on staging
- [ ] Rollback drill: flip `STORAGE_PROVIDER=uploadthing`, upload one doc

---

## Related docs

- [07-integrations.md](./07-integrations.md) — UploadThing P1 entry
- [migration-plan.md](./migration-plan.md) — Wave 2 Agent 7 roster
- [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) — R2 bucket setup
- `org-scaffold/tsc-infra/cloudflare/r2-setup.md` — bucket + CDN
