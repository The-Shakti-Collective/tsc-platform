# Authentication Architecture

> **Target:** Clerk as single identity source for all user-facing apps.  
> **Current:** Clerk on Platform (with dev stub); JWT on CoreKnot staff.

## Identity provider

| System | Role |
|--------|------|
| **Clerk** | Primary IdP — sessions, OAuth, orgs, webhooks |
| **JWT (CoreKnot)** | Legacy staff auth — `JWT_SECRET` on CoreKnot server |
| **Stub auth** | Local dev only — `TSC_AUTH_STUB=true` |
| **Legacy JWT bridge** | Platform API accepts CoreKnot tokens during migration |

## App-by-app matrix

| App | Production auth | Dev auth | Secret keys |
|-----|-----------------|----------|-------------|
| TSC Community | Clerk | Stub or Clerk test | `NEXT_PUBLIC_CLERK_*`, server `CLERK_SECRET_KEY` |
| TSC Website | Clerk | Stub or Clerk test | Same pattern |
| Platform API | Clerk Bearer JWT | Stub (`TSC_AUTH_STUB`) | `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| CoreKnot Client | JWT cookie (target: Clerk) | JWT + dev bypass | `JWT_SECRET`, `VITE_*` |
| CoreKnot API | JWT validation | `DEBUG_BYPASS` localhost | `JWT_SECRET`, `ENCRYPTION_KEY` |

## Platform API auth flow

Implementation: `apps/api/src/common/auth/`

```
Request → ClerkAuthGuard
            ├─ TSC_AUTH_STUB / placeholder Clerk key → StubAuthGuard
            ├─ Clerk verifyToken → membershipContext.resolve()
            └─ LegacyJwtService (if COREKNOT_JWT_BRIDGE=true)
```

| File | Purpose | Sunset |
|------|---------|--------|
| `clerk-auth.guard.ts` | Primary guard | Keep |
| `stub-auth.guard.ts` | Dev bypass | Keep for dev; **disabled when `NODE_ENV=production`** |
| `legacy-jwt.service.ts` | CoreKnot token bridge | **REMOVE** after CoreKnot Clerk migration |
| `legacy-jwt-config.ts` | Bridge env flags | **REMOVE** |
| `membership-context.service.ts` | Resolve org membership | Keep — extend for Clerk orgs |
| `roles.guard.ts`, `roles.decorator.ts` | RBAC | Keep — fix unscoped admin routes |

Env flags (`apps/api/.env.example`):

```bash
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
TSC_AUTH_STUB=true                    # dev only
# COREKNOT_JWT_SECRET=               # REMOVE
# COREKNOT_JWT_BRIDGE=false           # REMOVE
```

## CoreKnot auth flow (legacy)

- Staff login: email/password or Google OAuth → signed JWT (`JWT_EXPIRES_IN`, `JWT_ABSOLUTE_MAX_DAYS`)
- Mongo `users` collection (or Postgres `CkLegacyStaffUser` when `COREKNOT_AUTH_STORE=postgres`)
- Dev bypass: `DEBUG_BYPASS=true` + `POST /api/auth/dev-bypass` (localhost only)

**Target:** Clerk application (or Clerk Organizations) for `@theshakticollective.in` staff; CoreKnot API validates Clerk JWT same as Platform.

## MongoDB auth (legacy — REMOVE)

| Artifact | Location | Action |
|----------|----------|--------|
| Mongoose `User` model | `apps/coreknot/server/models/User.js` | REPLACE with Prisma + Clerk |
| Password hash in Mongo | user documents | MIGRATE to Clerk or deprecate local passwords |
| `ensureDevAdminUser.js` | seed script | REPLACE with Clerk dev user |
| `resetFounderPassword.js` | ops script | ARCHIVE after Clerk |

## Stub auth (dev only)

Frontends: `stub-auth-page.tsx` in Community and Website when Clerk keys are placeholders.

Rules:

- `TSC_AUTH_STUB=true` or empty/placeholder `CLERK_SECRET_KEY` enables stub on API
- `NEXT_PUBLIC_AUTH_STUB=true` enables stub UI on frontends
- **Never enable stub in production** — `NODE_ENV=production` disables API stub regardless

## Webhooks (gap — P0)

| Webhook | Status | Purpose |
|---------|--------|---------|
| Clerk → Platform API | **Not wired** | User create/update, org membership sync |
| Resend → CoreKnot | Wired | Mail tracking |
| Website → CoreKnot | Wired | Book-call, newsletter, artist-path |

**Blocker:** Without Clerk webhooks, Platform API cannot provision `User`/`Person` rows on signup.

## Cross-service auth

| Flow | Mechanism |
|------|-----------|
| Website → CoreKnot webhook | `X-Webhook-Secret` or HMAC |
| Platform → CoreKnot sync | `COREKNOT_SYNC_SECRET` |
| CoreKnot → Platform read | Service token or public routes |
| Browser → Platform API | Clerk session token as Bearer |

## Removal checklist

| Item | Priority | Owner |
|------|----------|-------|
| `LegacyJwtService` + bridge env | High | Platform backend |
| CoreKnot Mongo user auth | Critical | CoreKnot |
| `DEBUG_BYPASS` in any prod env | Critical | CoreKnot ops |
| Duplicate JWT secrets across services | Medium | Consolidate to Clerk |
| Stub auth docs implying prod use | Low | Docs |

## Target end state

```
All apps → Clerk
Platform API → verify Clerk JWT → resolve Person/User in Postgres
CoreKnot API → verify Clerk JWT → resolve staff role + tenant
No JWT_SECRET on CoreKnot
No TSC_AUTH_STUB in prod
No Mongo user collection reads at runtime
```

See [AUTH-ARCHITECTURE.md](./AUTH-ARCHITECTURE.md) companion: [docs/migration/05-auth-migration.md](../migration/05-auth-migration.md) (historical steps).
