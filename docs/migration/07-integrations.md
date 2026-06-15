**Ask mode** — cannot write `docs/migration/07-integrations.md`. Full doc content below; switch **Agent mode** to persist file.

---

# 07 — CoreKnot Integrations Migration Audit

> **Scope:** Legacy CoreKnot Express server (`apps/coreknot/server/`), client env (`apps/coreknot/client/.env.example`), founder patterns (root `.env.example`, `.specify/infrastructure/env-vars.md`, `apps/api/.env.example`).  
> **Target:** Monorepo `@tsc/api` — `apps/api/src/modules/integrations/` (+ payment, observability, queues).  
> **Date:** 2026-06-14 · **Agent 8**

---

## Executive summary

| Metric | Count |
|--------|------:|
| **Total integrations audited** | **28** |
| **P0** (prod break if missing) | **12** |
| **P1** (feature degradation) | **11** |
| **P2** (optional / scaffold / replaceable) | **5** |

**Not found in legacy CoreKnot server:** Stripe, Razorpay, Cashfree (client already calls `@tsc/api` `/api/payments` via `VITE_TSC_API_URL`). Google Cloud **KMS** not used — tokens encrypted with local `ENCRYPTION_KEY` (AES-256-GCM).

**Critical gap:** Clerk on **client only** (`@clerk/clerk-react`); legacy server still uses **JWT + Mongo User** (`authMiddleware.js`). `@clerk/clerk-sdk-node` in `package.json` but **unused** in server code.

---

## P0 integrations

### 1. MongoDB Atlas (primary database)

| | |
|---|---|
| **Current usage** | All CRM/ERP data. `config/database.js`, every model/service. Scripts use `MONGODB_URI` / `MONGODB_URI_PROD`. |
| **Env vars** | `MONGODB_URI`, `MONGODB_URI_PROD`, `MONGODB_DB_LOCAL`, `MONGODB_DB_PROD`, `MONGODB_DIRECT_URI`, `MONGODB_BACKUP_DB`, `MAIL_USE_PROD_DB` |
| **Target (`apps/api`)** | **Not replacing** for CoreKnot Phase 1 — CRM stays Mongo until domain cutover. Monorepo uses `DATABASE_URL` (Postgres/Neon) for Community/Marketplace. |
| **Migration steps** | 1) Keep Atlas prod URI on Render until Nest migration. 2) Document `COREKNOT_MONGODB_URI` alias in Railway when dual-running. 3) Long-term: map collections → Prisma or sync via `COREKNOT_SYNC_*`. |
| **Secrets** | Atlas connection strings (founder) |
| **Risk if missed** | **Total outage** — no auth, CRM, mail, tasks |

---

### 2. Redis (BullMQ, sessions, cache)

| | |
|---|---|
| **Current usage** | `config/index.js`, `infrastructure/queue/`, workers: `webhookWorker.js`, `importWorker.js`, `controllers/webhookController.js`. Session registry (`utils/sessionRegistry.js`), token revocation, hybrid cache (`services/hybridCache.js`), USD/INR rate cache. |
| **Env vars** | `REDIS_URL` (default `redis://127.0.0.1:6379`), WSL helper in `utils/wslRedis.js` |
| **Target (`apps/api`)** | Same `REDIS_URL` on Railway — BullMQ queues already scaffolded (`tsc.feed`, `tsc.reputation`, etc.). CoreKnot workers migrate to shared Redis or stay on legacy until cutover. |
| **Migration steps** | 1) Provision prod Redis (Render Key Value / Upstash). 2) Set `maxmemory-policy=noeviction`. 3) Port worker job names into `@tsc/api` queue module or run legacy workers against shared URL. |
| **Secrets** | `REDIS_URL` |
| **Risk if missed** | Import/webhook queues fall back to memory; session revocation breaks; campaign dispatch unreliable |

---

### 3. Resend (system + campaign email)

| | |
|---|---|
| **Current usage** | `domains/mail/services/mailDriver.js`, `mailService.js`, `emailProcessor.js`, `utils/sendSystemEmail.js`, `utils/smtpTransport.js`, backup notifications. Webhooks: `domains/mail/webhooks/resendWebhookHandler.js` → `/api/webhooks/resend`. |
| **Env vars** | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `BACKUP_FROM_EMAIL` (must be verified `@theshakticollective.in`) |
| **Target (`apps/api`)** | `integrations.service.ts` checks `RESEND_API_KEY`; add `ResendModule` under integrations (send + webhook). Prisma `integrationConnection` provider `resend`. |
| **Migration steps** | 1) Add keys to Railway + root `.env.example`. 2) Move webhook handler to Nest guard + raw body middleware. 3) Point Resend dashboard webhook to `api.theshakticollective.in/api/webhooks/resend`. 4) Reuse verified domain rules from `utils/resendFromEmails.js`. |
| **Secrets** | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` |
| **Risk if missed** | **Campaigns stop**; open/click tracking lost; backup alert emails fail |

> **Doc gap:** `RESEND_API_KEY` in `server/.env.render.example` but **not** in `server/.env.example`.

---

### 4. Auth & token encryption (JWT + ENCRYPTION_KEY)

| | |
|---|---|
| **Current usage** | `middleware/authMiddleware.js`, `utils/authSession.js`, `utils/jwtSecret.js`, `utils/encryption.js` (OAuth/API tokens at rest). |
| **Env vars** | `JWT_SECRET`, `ENCRYPTION_KEY` (64-char hex), `JWT_EXPIRES_IN`, `JWT_ABSOLUTE_MAX_DAYS`, `JWT_REFRESH_MINUTES`, `ADMIN_EMAIL`, `ALLOWED_DOMAIN` |
| **Target (`apps/api`)** | `ClerkAuthGuard` + `CLERK_SECRET_KEY`. Map Clerk user → CoreKnot tenant during transition. |
| **Migration steps** | 1) Wire Clerk on client (partial). 2) Add Clerk JWT validation on legacy routes OR proxy through `@tsc/api`. 3) Migrate encrypted tokens with same `ENCRYPTION_KEY` or re-OAuth all connections. |
| **Secrets** | `JWT_SECRET`, `ENCRYPTION_KEY`, Clerk keys (founder) |
| **Risk if missed** | Login failure; **all stored OAuth tokens unreadable** after key rotation |

---

### 5. Inbound TSC website webhooks

| | |
|---|---|
| **Current usage** | `routes/webhookRoutes.js`, `controllers/webhookController.js`, `utils/webhookAuth.js`, `middleware/webhookIdempotency.js` |
| **Routes** | `POST /api/webhooks/book-call`, `/artist-path`, `/artist-enquiry`, `/newsletter`, `/masterclass-review` |
| **Env vars** | `BOOK_CALL_WEBHOOK_SECRET`, `ARTIST_PATH_WEBHOOK_SECRET`, `ARTIST_ENQUIRY_WEBHOOK_SECRET`, `NEWSLETTER_WEBHOOK_SECRET`, `MASTERCLASS_REVIEW_WEBHOOK_SECRET` |
| **Target (`apps/api`)** | New `webhooks` module with HMAC/`X-Webhook-Secret` guards; share secrets with `apps/website`. |
| **Migration steps** | 1) Copy verification logic from `webhookAuth.js`. 2) Update website env to new API host. 3) Run idempotency in Redis (existing pattern). 4) Smoke: `scripts/smoke-tsc-webhooks.js`. |
| **Secrets** | Five shared webhook secrets (coordinate with website deploy) |
| **Risk if missed** | **Lead loss** from booking, newsletter, artist forms |

---

### 6. HolySheet (CRM sheet sync)

| | |
|---|---|
| **Current usage** | `services/holySheetService.js` (lead backup sync), `domains/artists/services/artistPathImportService.js`, `domains/mail/routes/holysheetRouter.js`, scripts `clean_holysheet.js`, `split_holysheet_contacts.js` |
| **Env vars** | `HOLYSHEET_API_KEY`, `HOLY_SHEET_API_KEY` (alias), `HOLYSHEET_ARTIST_PATH_API_KEY`, `HOLYSHEET_ARTIST_PATH_SHEET`, `HOLYSHEET_UNSUBSCRIBED_API_KEY` |
| **API** | `https://holysheet.soneshjain.com/api/v1` |
| **Target (`apps/api`)** | `integrations` provider `holysheet` (custom) or keep legacy worker until CRM domain migrates. |
| **Migration steps** | 1) Remove hardcoded fallback keys in `holySheetService.js` (security). 2) Port syncLeadToSheet to queue job. 3) Document artist-path import cron. |
| **Secrets** | HolySheet API keys (per spreadsheet) |
| **Risk if missed** | Lead backup desync; artist-path import empty |

---

### 7. Google OAuth (staff login, Calendar, Drive)

| | |
|---|---|
| **Current usage** | `utils/googleAuth.js`, `domains/integrations/googleRoutes.js`, `googleAccountsRoutes.js`, `controllers/googleController.js` |
| **Env vars** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| **Target (`apps/api`)** | `integrations.service.ts` OAuth readiness for `google`; implement OAuth flow + token storage in `integrationConnection`. |
| **Migration steps** | 1) Register callbacks on `api.theshakticollective.in`. 2) Use `resolveOAuthRedirectUri` logic from `oauthEnv.js`. 3) Encrypt refresh tokens with shared `ENCRYPTION_KEY`. |
| **Secrets** | Google OAuth client ID/secret |
| **Risk if missed** | Staff Google login/calendar sync broken |

---

### 8. Exly (CRM audience & webhooks)

| | |
|---|---|
| **Current usage** | `services/exlyService.js`, `domains/integrations/controllers/exlyController.js`, `controllers/proxyController.js`, audience routes in `holysheetRouter.js` |
| **Env vars** | `EXLY_API_KEY`, `EXLY_API_URL`, `EXLY_WEBHOOK_SECRET` |
| **Target (`apps/api`)** | Integrations module + webhook endpoint; optional proxy removal. |
| **Migration steps** | 1) Port webhook signature check. 2) Move offering sync to scheduled job. 3) Update Exly dashboard callback URL. |
| **Secrets** | `EXLY_API_KEY`, `EXLY_WEBHOOK_SECRET` |
| **Risk if missed** | Webinar/Exly lead import stops |

---

### 9. AiSensy / WhatsApp

| | |
|---|---|
| **Current usage** | `utils/aisensyClient.js`, `domains/crm/services/leadWriteService.js`, `domains/artists/services/artistPathImportService.js` |
| **Env vars** | `AISENSY_API_KEY`, `AISENSY_ARTIST_PATH_CAMPAIGN` |
| **API** | `https://backend.aisensy.com/campaign/t1/api/v2` |
| **Target (`apps/api`)** | Notifications or integrations submodule (`whatsapp` / `aisensy`). |
| **Migration steps** | 1) Centralize client. 2) Template names per campaign in config, not hardcoded. |
| **Secrets** | `AISENSY_API_KEY` |
| **Risk if missed** | WhatsApp confirmations silently skipped |

---

### 10. Meta / Instagram (OAuth, webhooks, compliance)

| | |
|---|---|
| **Current usage** | `services/metaGraphService.js`, `domains/artists/providers/InstagramProvider.js`, `routes/webhookRoutes.js` (Instagram verify + events), `controllers/metaDataDeletionController.js` |
| **Env vars** | `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_WEBHOOK_VERIFY_TOKEN`, `META_DEFAULT_PAGE_ID`, `META_DEFAULT_IG_ID`, `META_USER_TOKEN` (dev only) |
| **Target (`apps/api`)** | `integrations` provider `meta`; webhook + data-deletion routes. |
| **Migration steps** | 1) Re-register OAuth redirect (`CLIENT_URL/oauth/meta/callback`). 2) Webhook URL → new API. 3) Data deletion callback for App Review. 4) See `docs/GOOGLE_META_APP_VERIFICATION.md`. |
| **Secrets** | Meta app secret, verify token |
| **Risk if missed** | IG analytics dead; **App Review / compliance failure** |

---

### 11. Spotify (artist analytics)

| | |
|---|---|
| **Current usage** | `domains/artists/providers/SpotifyProvider.js`, `domains/artists/services/spotifyTokenManager.js`, `config/integrations.config.js` |
| **Env vars** | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_OAUTH_REDIRECT_URI` |
| **Target (`apps/api`)** | `integrations` provider `spotify`; token manager as service. |
| **Migration steps** | 1) Remove hardcoded credential fallbacks in `spotifyTokenManager.js`. 2) OAuth + client-credentials paths. |
| **Secrets** | Spotify client ID/secret |
| **Risk if missed** | Artist Spotify metrics unavailable |

---

### 12. YouTube (artist analytics)

| | |
|---|---|
| **Current usage** | `domains/artists/providers/YouTubeProvider.js`, OAuth callbacks under `/api/artists/auth/callback/youtube` |
| **Env vars** | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_OAUTH_REDIRECT_URI`, `YOUTUBE_REDIRECT_URI_PROD`, `YOUTUBE_API_KEY` |
| **Target (`apps/api`)** | `integrations` provider `youtube`. |
| **Migration steps** | Same as Google OAuth registration; separate GCP client recommended. |
| **Secrets** | YouTube OAuth + API key |
| **Risk if missed** | YouTube subscriber/view sync fails |

---

## P1 integrations

### 13. UploadThing (file uploads)

| **Files** | `config/uploadthing.js`, `app/registerRoutes.js` (`/api/uploadthing`), `utils/uploadthingServer.js`, client `utils/uploadthing.js` |
| **Env** | `UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET`, `VITE_UPLOADTHING_URL` |
| **Target** | **Cloudflare R2** (`R2_*` in `apps/api/.env.example`) |
| **Migration** | Presigned upload API in `@tsc/api`; replace UploadThing routers (image, document, finance, mail template). |
| **Risk** | Finance docs, campaign attachments, mail images fail upload |

---

### 14. Supabase (secondary Postgres store)

| **Files** | `config/supabase.js`, `services/supabase/*`, `workers/supabaseSyncWorker.js`, `routes/supabaseAdminRoutes.js` |
| **Env** | `SUPABASE_SECONDARY_ENABLED`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_PG_MODE`, `LOGS_PRIMARY_SUPABASE`, `BACKUP_DESTINATION` |
| **Target** | Evaluate vs Neon/R2 for logs/backups; may stay parallel to Mongo long-term |
| **Migration** | Run `supabase:setup`, `supabase:backfill`, health scripts; Render uses PostgREST mode |
| **Risk** | Log/backup/rollup reads degrade; not primary CRM blocker |

---

### 15. Multi-provider SMTP (SendGrid, Brevo, Mailjet, Gmail, Amazon SES, …)

| **Files** | `utils/smtpPresets.js`, `utils/smtpTransport.js`, `utils/envProviderCredentials.js`, per-profile DB credentials |
| **Env** | `SENDGRID_API_KEY`, `BREVO_SMTP_KEY`, `BREVO_SMTP_USER`, `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `EMAIL_ADDRESS`, `EMAIL_PASSWORD`, `SMTP_*` |
| **Target** | Integrations `email-transport` adapter; Resend remains system default |
| **Migration** | Port preset registry; tenant-scoped SMTP profiles in Postgres |
| **Risk** | Per-rep mail profiles fail; campaigns fall back to Resend only |

---

### 16. AWS SES / SNS (legacy mail events)

| **Files** | `routes/sesRoutes.js` → `POST /api/ses/webhook` |
| **Env** | None (SNS confirms via `SubscribeURL`) |
| **Target** | Optional — consolidate on Resend webhooks or add SNS signature verification in `@tsc/api` |
| **Migration** | If still wired in AWS, update SNS subscription URL |
| **Risk** | Legacy SES campaign stats stale if still in use |

---

### 17. Clerk (SSO — partial)

| **Files** | Client: `lib/clerkEnv.js`, `SignInPage.jsx`, `ProtectedRoute.jsx`. Server: **JWT only** — no Clerk verification |
| **Env** | `VITE_CLERK_PUBLISHABLE_KEY`, root `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| **Target** | Unified Clerk on `@tsc/api` (`ClerkAuthGuard`); deprecate legacy JWT |
| **Migration** | Bridge Clerk session → legacy API token OR migrate all routes to Nest |
| **Risk** | Split-brain auth; prod sign-in broken if keys missing on Vercel |

---

### 18. Payments (Stripe / Razorpay / Cashfree)

| **Legacy** | **None on Express server** |
| **Client** | `lib/paymentsApi.js` → `@tsc/api` when `VITE_TSC_API_URL` set |
| **Env** | `STRIPE_KEY`, `RAZORPAY_KEY`, `CASHFREE_KEY` (`apps/api/.env.example`) |
| **Target** | `apps/api/src/modules/payment/` (stub adapters today) |
| **Migration** | Implement real adapters; wire CoreKnot client to prod API |
| **Risk** | Invoice collect returns stub until real keys + adapters |

---

### 19. Sentry

| **Server** | `utils/sentry.js`, `middleware/errorMiddleware.js`, `datadog-init.js` loaded first |
| **Client** | `client/src/lib/observability.js` |
| **Env** | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SENTRY_TRACES_SAMPLE_RATE`, `VITE_SENTRY_DSN` |
| **Target** | `apps/api/src/observability/` (scaffold exists) |
| **Migration** | Same DSN per surface or separate projects |
| **Risk** | Blind to prod exceptions |

---

### 20. PostHog

| **Client** | `client/src/lib/observability.js` |
| **Env** | `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`; API: `POSTHOG_PROJECT_TOKEN` |
| **Target** | API observability module (no-op without token) |
| **Migration** | Community project vs Default project — align with founder PostHog setup |
| **Risk** | Product analytics gap only |

---

### 21. Web Push (VAPID)

| **Files** | `services/pushNotificationService.js`, `utils/pushSubscriptions.js` |
| **Env** | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| **Target** | Notifications module in `@tsc/api` or keep on CRM until cutover |
| **Migration** | Generate once; same keys on Render |
| **Risk** | Desktop notifications off |

---

### 22. Google Sheets (service account — audience import)

| **Files** | `domains/mail/controllers/holysheetController.js`, `services/orgAccountImportService.js`, `test-sheets.js` |
| **Env** | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID` |
| **Note** | Hardcoded spreadsheet ID in `holysheetController.js` — move to env |
| **Target** | Integrations `google-sheets` reader |
| **Risk** | HolySheet “fetch all” audience import fails |

---

### 23. Songstats (artist enterprise stats)

| **Files** | `domains/artists/v2Routes.js` |
| **Env** | `SONGSTATS_API_KEY` |
| **Target** | Integrations provider or artist-analytics service |
| **Risk** | Artist stats endpoint 503 |

---

## P2 integrations

### 24. Datadog APM / RUM

| **Server** | `datadog-init.js` — `DD_API_KEY`, `DD_SERVICE`, `DD_ENV`, `DD_VERSION` |
| **Client** | `VITE_DD_*` in `client/.env.example` |
| **Target** | Optional alongside Sentry/PostHog |
| **Risk** | Ops visibility only |

---

### 25. Frankfurter (USD→INR)

| **Files** | `services/usdInrRateService.js` |
| **Env** | `USD_INR_RATE_OVERRIDE` (optional) |
| **API** | `https://api.frankfurter.app` — no key |
| **Target** | Shared FX micro-service or cache in Redis |
| **Risk** | Subscription pricing display wrong |

---

### 26. Geo IP (mail analytics)

| **Files** | `utils/geoLookup.js` — `geoip-lite` + `ip-api.com` |
| **Env** | None (free tier) |
| **Target** | Keep in mail analytics module |
| **Risk** | Campaign geo breakdown degraded |

---

### 27. Trigger.dev (optional mail dispatch)

| **Files** | `services/triggerService.js` |
| **Env** | `TRIGGER_API_KEY`, `TRIGGER_API_URL`, `CAMPAIGN_USE_TRIGGER=true` |
| **Target** | BullMQ on `@tsc/api` (preferred) |
| **Risk** | None unless explicitly enabled |

---

### 28. Monorepo scaffolds (not in legacy server)

| Integration | Location | Status |
|-------------|----------|--------|
| **BetterStack** | `BETTERSTACK_HEARTBEAT_URL` | API heartbeat scaffold |
| **Typesense** | `TYPESENSE_*` | Search P2 |
| **Cloudflare R2** | `R2_*` | UploadThing replacement target |
| **DistroKid** | `integrations.service.ts` | Readiness check only |
| **COREKNOT_SYNC** | `COREKNOT_SYNC_URL`, `COREKNOT_SYNC_SECRET` | Bidirectional sync hook |

---

## Target architecture (`apps/api`)

```
apps/api/src/modules/
├── integrations/          # OAuth readiness, connection CRUD (Prisma)
├── payment/               # Stripe/Razorpay/Cashfree stubs → real adapters
├── observability/         # Sentry, PostHog, BetterStack
└── (future) webhooks/     # TSC inbound + Resend + Exly + Meta
```

Existing OAuth readiness (`GET /api/integrations/oauth-readiness`):

```14:31:apps/api/src/modules/integrations/integrations.service.ts
  getOAuthReadiness() {
    const checks = {
      google: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
      meta: Boolean(process.env.META_APP_ID?.trim()),
      spotify: Boolean(process.env.SPOTIFY_CLIENT_ID?.trim()),
      youtube: Boolean(process.env.YOUTUBE_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim()),
      resend: Boolean(process.env.RESEND_API_KEY?.trim()),
      distrokid: Boolean(process.env.DISTROKID_API_KEY?.trim()),
    };
    // ...
  }
```

Prisma providers today: `google | meta | spotify | youtube | distrokid | resend | other`.

---

## Recommended migration phases

| Phase | Integrations | Blocker |
|-------|--------------|---------|
| **R0 (done)** | Sentry/PostHog/Redis/Clerk scaffold on `@tsc/api` | Founder secrets |
| **Phase A** | Webhooks, Resend, Redis queues, Mongo URI | Website + Render cutover |
| **Phase B** | Google/Meta/Spotify/YouTube OAuth, HolySheet, Exly, AiSensy | OAuth console updates |
| **Phase C** | UploadThing→R2, Supabase decision, SMTP profiles | R2 founder task |
| **Phase D** | Clerk replaces JWT; payments live adapters | User migration plan |

---

## Founder secrets checklist (CoreKnot-specific)

| Secret | Priority |
|--------|----------|
| `MONGODB_URI_PROD` | P0 |
| `REDIS_URL` | P0 |
| `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` | P0 |
| `JWT_SECRET`, `ENCRYPTION_KEY` | P0 |
| Webhook secrets (×5) | P0 |
| `HOLYSHEET_*` keys | P0 |
| `GOOGLE_*`, `META_*`, `SPOTIFY_*`, `YOUTUBE_*` | P0/P1 |
| `EXLY_*`, `AISENSY_API_KEY` | P0 |
| `UPLOADTHING_*` → later `R2_*` | P1 |
| `SUPABASE_*` | P1 |
| `VAPID_*` | P1 |
| `SONGSTATS_API_KEY` | P1 |
| `STRIPE_KEY`, `RAZORPAY_KEY` | P1 (via `@tsc/api`) |
| `CLERK_*` | P0 for new SSO path |
| `SENTRY_DSN`, PostHog keys | P1 |
| `DD_API_KEY` | P2 |

---

## Parent agent summary

| | |
|---|---|
| **Integration count** | **28** (12 P0 · 11 P1 · 5 P2) |
| **P0 focus** | Mongo, Redis, Resend, JWT/encryption, inbound webhooks, HolySheet, Google OAuth, Exly, AiSensy, Meta, Spotify, YouTube |
| **P2 defer** | Datadog, Frankfurter, geo IP, Trigger.dev, Typesense/R2/BetterStack scaffolds |
| **Top risks** | (1) Clerk client vs JWT server split, (2) `RESEND_API_KEY` missing from main `.env.example`, (3) hardcoded HolySheet/Spotify fallbacks, (4) webhook URL changes on API host migration |
| **Payments** | Already delegated to `@tsc/api` — not legacy server |

---

To write this to `c:\Projects\TSC Platform\docs\migration\07-integrations.md`, switch to **Agent mode** and ask again.
