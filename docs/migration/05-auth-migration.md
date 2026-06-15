# 05 — CoreKnot Auth Migration (JWT/Session → Clerk)

> **Agent 6 — Auth Migration Agent** · **Date:** 2026-06-14  
> **Sources:** `apps/coreknot/server/middleware/authMiddleware.js`, `apps/coreknot/server/domains/auth/`, `apps/api/src/common/auth/`  
> **Related:** [02-schema-mapping.md](./02-schema-mapping.md) §1.1–1.2 · [03-domain-mapping.md](./03-domain-mapping.md) §Auth · [07-integrations.md](./07-integrations.md) §Auth

---

## Executive summary

CoreKnot production auth today is **Express JWT + httpOnly cookie** (`coreknot_token_v3`) backed by Mongo `User`. The TSC API target is **Clerk JWT** via `ClerkAuthGuard` + `MembershipContextService` (Prisma `User` / `Person` / `OrganizationMember`).

**Strategy:** dual-auth transition window — accept legacy session JWTs on `@tsc/api` routes while the Vite client migrates from cookie auth to Clerk, then retire JWT paths after cutover.

**Gate:** No full auth cutover until founder completes Clerk prod keys ([FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md)) and Agent 3 user ETL creates `Person` + identifier mappings.

**Code delivered (bridge):** optional legacy JWT shim in `apps/api/src/common/auth/` — enabled via `COREKNOT_JWT_BRIDGE` + `COREKNOT_JWT_SECRET`.

---

## 1. Legacy auth inventory

### 1.1 Session model (`authMiddleware.js` + `utils/authSession.js`)

| Concern | Implementation |
|---------|----------------|
| Token transport | Cookie `coreknot_token_v3` or `Authorization: Bearer` |
| Signing | `JWT_SECRET`, payload `{ id, loginAt, jti }` |
| Inactivity | Sliding refresh — `JWT_EXPIRES_IN` (default 7d) |
| Absolute cap | `JWT_ABSOLUTE_MAX_DAYS` (default 30) from `loginAt` |
| Revocation | Redis via `tokenRevocation` + `sessionRegistry` |
| User load | `loadAuthUser(decoded.id)` → Mongo `User` + populated `departmentId` |
| Tenant | `req.tenantId` from user; `runWithContext` for async local storage |
| Dev bypass | `DEBUG_BYPASS=true` + localhost + `DEBUG_BYPASS_TOKEN` → admin user |

### 1.2 Auth routes (`domains/auth/`)

| Route group | Endpoints | Target fate |
|-------------|-----------|-------------|
| `routes.js` | register, login, logout, forgot/reset password, Google OAuth, `/me`, sessions CRUD, realtime-token | **Deprecate** password flows; **Clerk** for sign-in; compatibility aliases during transition |
| `userRoutes.js` | team, sales-reps, profile, directory, admin CRUD | **`users/`** module + org-scoped RBAC |
| `authController.js` | Issues JWT via `establishSession` / `finishAuthSession` | Replaced by Clerk session + webhook provisioning |

### 1.3 Authorization model (legacy)

Legacy authZ is **department-centric page permissions**, not platform roles:

```
User.departmentId → Department { slug, permissionPreset, pagePermissions[] }
User.pagePermissions[] → override (empty = inherit department)
```

Guards in `authMiddleware.js`:

| Middleware | Rule |
|------------|------|
| `protect` | Valid session JWT + user exists |
| `admin` | Department slug/preset `admin` |
| `opsOrAdmin` | Admin or ops page keys (`finance`, `announcements`, `ops_logs`) |
| `requirePageAccess(key)` | `hasPageAccess(user, key)` |
| `artistOrAdmin` | Admin or `artists` page |
| `artistMembershipAccess(perm)` | Admin/artist-manager OR artist team membership |

Page keys defined in `utils/pagePermissions.js` — 30+ keys across platform, workspace, CRM, admin groups.

### 1.4 Target auth (`apps/api/src/common/auth/`)

| Component | Role |
|-----------|------|
| `ClerkAuthGuard` | Verify Clerk JWT (`verifyToken`), set `request.clerkUserId` |
| `StubAuthGuard` | Dev-only when `TSC_AUTH_STUB=true` or placeholder Clerk keys |
| `MembershipContextService` | Resolve `MembershipContext` from Clerk → Person → roles |
| `RolesGuard` | `@Roles(...)` decorator → `hasPlatformRole(membership, ...)` |
| `clerk-config.ts` | Stub/admin allowlists |

Target authZ is **platform role + org membership**, not page keys:

```typescript
MembershipContext {
  userId: string;           // Clerk user id (or legacy mongo id during bridge)
  personId?: string;
  platformRole?: PlatformRole;
  organizationMemberships: { organizationId, role }[];
  communityMemberships, artistMemberships, roles[]
}
```

---

## 2. JWT/session → Clerk bridge strategy

### 2.1 Target end state

```
Client (Clerk React) → Bearer Clerk JWT → ClerkAuthGuard
  → User.clerkUserId lookup → Person
  → OrganizationMember + User.platformRole
  → RolesGuard / domain guards
```

Clerk webhooks (`user.created`, `user.updated`) provision:

1. `Person` + `PersonIdentifier(email)`
2. `User { clerkUserId, personId, platformRole }`
3. `OrganizationMember { organizationId, personId, role }`
4. `PersonIdentifier { provider: coreknot_user, externalId: <mongoObjectId> }` — lineage only

### 2.2 Transition architecture (dual-auth)

```
                    ┌─────────────────────────────────────┐
  Client request    │         ClerkAuthGuard              │
  Bearer token ────►│  1. TSC_AUTH_STUB? → StubAuthGuard  │
                    │  2. verifyToken (Clerk)             │
                    │  3. if fail + bridge enabled:       │
                    │     LegacyJwtService.verify()       │
                    │  4. MembershipContextService        │
                    └─────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
           resolve(clerkUserId)              resolveFromLegacyMongoUserId(id)
           User.clerkUserId → personId        PersonIdentifier(coreknot_user, mongoId)
                                              or SyncMapping(coreknot, User)
```

**Token discrimination:** Try Clerk verification first. On signature/validation failure, if `COREKNOT_JWT_BRIDGE=true`, verify with `COREKNOT_JWT_SECRET` (alias `JWT_SECRET`). Legacy payload uses `id` (Mongo user id); Clerk uses `sub`. Reject tokens with `purpose` (OAuth establish tickets).

**Cookie gap:** Nest guard reads `Authorization` header only. During transition:

- **Option A (recommended):** Client sends legacy cookie value as `Authorization: Bearer <token>` on `@tsc/api` calls (axios interceptor).
- **Option B:** Add cookie parser middleware on API for `coreknot_token_v3` (only when bridge enabled).

Legacy Express server continues serving `/api/auth/*` until compatibility layer replaces it.

### 2.3 Bridge limitations (v1 shim)

| Legacy feature | Bridge v1 | Follow-up |
|----------------|-----------|-----------|
| JWT signature + expiry | ✅ | — |
| Absolute 30-day session cap | ✅ | — |
| Redis session revocation (`jti`) | ❌ Skipped | Wire `REDIS_URL` + revocation check in v2 |
| Sliding cookie refresh | ❌ N/A (stateless verify) | Client re-login or Clerk migration |
| `touchLastOnline` | ❌ | Presence via PostHog / separate job |
| Page-level `requirePageAccess` | ❌ | Map to roles or add `PageAccessGuard` adapter |

### 2.4 Environment flags

| Variable | Purpose |
|----------|---------|
| `CLERK_SECRET_KEY` | Production Clerk JWT verification |
| `TSC_AUTH_STUB` | Dev stub when Clerk unset |
| `COREKNOT_JWT_BRIDGE` | `true` to enable legacy JWT fallback after Clerk fails |
| `COREKNOT_JWT_SECRET` | Same value as legacy `JWT_SECRET` |
| `JWT_ABSOLUTE_MAX_DAYS` | Match legacy (default 30) |
| `TSC_ADMIN_USER_IDS` | Comma-separated Clerk ids with platform admin bypass |

---

## 3. User mapping

### 3.1 Three-layer identity

```
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────────────────┐
│ Mongo User       │     │ Clerk User       │     │ Prisma                      │
│ (legacy staff)   │────►│ user_xxx         │────►│ Person                      │
│ _id ObjectId     │     │ email, oauth     │     │ User.clerkUserId            │
│ email, dept, ... │     │                  │     │ OrganizationMember          │
└──────────────────┘     └──────────────────┘     └─────────────────────────────┘
         │                                                    ▲
         └──── PersonIdentifier(coreknot_user, mongoId) ──────┘
               SyncMapping(sourceSystem: coreknot, externalId: mongoId)
```

### 3.2 Field mapping (staff `User`)

| Mongo `User` | Clerk | Prisma |
|--------------|-------|--------|
| `_id` | — | `PersonIdentifier(coreknot_user)` + `SyncMapping.externalId` |
| `email` | primary email | `Person.email`, Clerk import key |
| `name` | `firstName`/`lastName` or `username` | `Person.name`, `Identity.displayName` |
| `avatar` | `imageUrl` | `Identity.avatarUrl` |
| `phone` | phoneNumbers | `Person.phone` |
| `googleId` | OAuth connection | Clerk owns post-cutover |
| `departmentId` | — | `OrganizationMember.role` (derived) |
| `teams[]` | — | `OrganizationTeamMember` |
| `pagePermissions[]` | — | `Identity.metadata.pagePermissions` (until RBAC parity) |
| `password` | — | **Dropped** — users re-auth via Clerk |
| `tenantId` | — | `OrganizationMember.organizationId` |

### 3.3 Resolution order (`MembershipContextService`)

**Clerk path:**

1. `User.findUnique({ where: { clerkUserId } })` → `personId`
2. Fallback: `PersonIdentifier` email match from Clerk JWT claims (webhook backfill)
3. `ensurePersonLinked` via `identity/resolve` only for net-new Clerk users

**Legacy JWT path:**

1. `PersonIdentifier.find({ provider: coreknot_user, externalId: mongoUserId })`
2. `SyncMapping.resolve(coreknot, mongoUserId, Person|User)`
3. If no mapping → **401** (user not migrated yet)

### 3.4 Clerk import procedure (Agent 3 + founder)

1. Export Mongo users (email, name, department slug, `_id`, active status).
2. Clerk Backend API bulk import (`createUser` / import CSV) — **no password hash migration**.
3. For each imported user, ETL script creates Prisma rows + mappings (see checklist).
4. Send password-reset / magic-link campaign for first Clerk login.

### 3.5 CRM `Person` vs staff `User`

Legacy has two “person” concepts:

- **Staff `User`** — authenticated internal users (this migration).
- **CRM `Person`** — deduplicated contact graph (`domains/person/`).

Do not merge staff User into CRM Person unless email collision rules in `identity-resolution.service.ts` explicitly match. Staff users get their own `Person` row linked via `User.personId`.

---

## 4. Role mapping

### 4.1 Department preset → `PlatformRole`

Legacy departments use `permissionPreset` / `slug` (`utils/departmentPermissions.js`, `utils/pagePermissions.js`):

| Department slug / preset | Legacy capability | `User.platformRole` | `OrganizationMember.role` |
|--------------------------|-------------------|---------------------|---------------------------|
| `admin` | All pages | `SUPER_ADMIN` | `SUPER_ADMIN` |
| `ops` / `operations` | Base + finance, announcements, ops_logs | `MANAGER` | `MANAGER` |
| `sales` | Base + CRM pages | `MANAGER` | `MANAGER` |
| `artist-management` | Base + artists + CRM | `MANAGER` | `MANAGER` |
| `creative` | Base + creative tools | `TEAM_MEMBER` | `TEAM_MEMBER` |
| `standard` / default | Base pages only | `TEAM_MEMBER` | `TEAM_MEMBER` |
| (none) | Base pages | `TEAM_MEMBER` | `TEAM_MEMBER` |

**Edge cases:**

- User-level `pagePermissions[]` override → store in `Identity.metadata.pagePermissions` until Nest routes implement page-level guards or map elevated keys to `MANAGER`.
- Artist team roles (`artistMembershipService`) → `PersonRole` + artist module guards (`canManageArtist`), not `OrganizationMember`.
- `TSC_ADMIN_USER_IDS` env → bypass equivalent to legacy admin (maps to `roles: ['admin']`).

### 4.2 Legacy middleware → target guards

| Legacy | Target equivalent |
|--------|-------------------|
| `protect` | `ClerkAuthGuard` |
| `admin` | `@Roles('SUPER_ADMIN')` or `isAdmin(membership)` |
| `opsOrAdmin` | `@Roles('SUPER_ADMIN', 'MANAGER')` + org scope |
| `requirePageAccess('leads')` | **Gap** — needs `PageAccessGuard` reading metadata or CRM module guard |
| `artistOrAdmin` | `@Roles('SUPER_ADMIN', 'MANAGER')` OR `canManageArtist(ctx, artistId)` |
| `artistMembershipAccess` | Artist module membership service (Prisma) |

**Recommendation:** Phase bridge uses platform roles only. Port page-key checks to a `@PageAccess(...)` decorator in Wave 2 compatibility layer (Agent 5) for routes the client still calls with legacy semantics.

### 4.3 Page key inventory (for metadata preservation)

Preserve full array in `Identity.metadata.pagePermissions` during ETL. Reference keys: `dashboard`, `calendar`, `projects`, `leads`, `followups`, `artists`, `finance`, `admin_users`, `admin_data`, … — see `ALL_PAGE_KEYS` in legacy `pagePermissions.js`.

---

## 5. Dual-auth transition window

### 5.1 Phases

| Phase | Duration | Client auth | API auth | Mongo User |
|-------|----------|-------------|----------|------------|
| **D0** (now) | — | Hybrid: Clerk stub + legacy cookie on Express | Express JWT on legacy routes; Clerk on new Nest routes | Source of truth |
| **D1** Bridge | 2–4 weeks | Clerk sign-in + legacy cookie fallback for unmigrated routes | Dual: Clerk + `COREKNOT_JWT_BRIDGE` on `@tsc/api` | Still source; sync mappings |
| **D2** Majority Clerk | 2–4 weeks | Clerk primary; cookie only for unmigrated pages | Clerk default; bridge for stragglers | Read-only for audit |
| **D3** Cutover | 1 week | Clerk only | Bridge disabled | Decommissioned |
| **D4** Cleanup | — | — | Remove bridge code + env | — |

### 5.2 Client changes (coordination with Agent 4/5)

1. Wrap app in `@clerk/clerk-react` (partial — `clerkEnv.js` exists).
2. Axios interceptor priority:
   - If Clerk session active → `Authorization: Bearer ${clerkToken}`
   - Else if legacy cookie → attach cookie (Express) or bearer (Nest bridge)
3. Replace `/api/auth/login` flows with Clerk `<SignIn />`.
4. Map `/api/auth/me` response shape to Clerk `useUser()` + `/api/users/me` Nest endpoint.

### 5.3 Rollback

- Keep `JWT_SECRET` and bridge env vars for 30 days post-D3.
- Clerk can be bypassed by re-enabling bridge + pointing client back to Express auth routes.

---

## 6. Implementation checklist

### 6.1 Prerequisites (founder / Agent 3)

- [ ] Clerk application + prod `CLERK_SECRET_KEY` / publishable key on client
- [ ] Clerk webhook endpoint → Nest (`user.created`, `user.updated`, `user.deleted`)
- [ ] Mongo user export script with department slug + `_id`
- [ ] Clerk bulk import + mapping CSV
- [ ] ETL: `Person` + `User` + `OrganizationMember` + `PersonIdentifier(coreknot_user)`
- [ ] Default org from legacy `Tenant` → `Organization`

### 6.2 API bridge (Agent 6 — **partial done**)

- [x] `LegacyJwtService` — verify legacy session JWT
- [x] `ClerkAuthGuard` — Clerk first, legacy fallback when bridge enabled
- [x] `MembershipContextService.resolveFromLegacyMongoUserId`
- [ ] Clerk path: resolve via `User.clerkUserId` (fix conflation with `coreknot_user` identifier)
- [ ] Redis revocation check for legacy tokens (optional v2)
- [ ] Cookie extractor middleware for `coreknot_token_v3` (optional)
- [ ] `@PageAccess()` guard for legacy page-key routes

### 6.3 Auth route compatibility (Agent 5)

- [ ] Nest aliases: `POST /api/auth/logout` → Clerk sign-out hint
- [ ] `GET /api/auth/me` → membership + profile shape matching legacy `formatAuthUser`
- [ ] Deprecate register/login/password routes (410 or proxy to Clerk)
- [ ] Session list/revoke → Clerk session APIs or drop

### 6.4 Validation (Agent 9)

- [ ] Contract test: legacy JWT → Nest protected route returns 200 with mapped person
- [ ] Contract test: Clerk JWT → same user resolves same `personId`
- [ ] Role test: admin department user → `SUPER_ADMIN` passes `@Roles`
- [ ] E2E: Clerk sign-in → workspace tasks route
- [ ] Negative: expired legacy JWT → 401; revoked `jti` → 401 (when Redis wired)

### 6.5 Cutover criteria (no early cutover)

Do **not** disable legacy Express auth until:

1. 100% staff have Clerk accounts + Prisma `User` rows
2. Client no longer calls `/api/auth/login` in production traffic (PostHog/analytics)
3. All client API calls to `@tsc/api` succeed with Clerk token
4. Bridge traffic = 0 for 7 consecutive days
5. Founder sign-off on password-flow deprecation comms

---

## 7. Risk register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Password hashes not portable to Clerk | High | Force re-auth; comms before cutover |
| `coreknot_user` identifier ambiguity (Clerk id vs mongo id) | High | ETL uses mongo id only; Clerk resolves via `User.clerkUserId` |
| Page-level RBAC regression | Medium | Preserve `pagePermissions` in metadata; adapter guard |
| Session revocation gap in bridge v1 | Medium | Short bridge window; enable Redis check in v2 |
| OAuth tokens encrypted with `ENCRYPTION_KEY` | High | Same key on Railway during transition ([07-integrations.md](./07-integrations.md)) |
| Dual-write identity drift | Medium | Clerk webhook + sync module idempotency |

---

## 8. File reference

| Path | Notes |
|------|-------|
| `apps/coreknot/server/middleware/authMiddleware.js` | Legacy guard stack |
| `apps/coreknot/server/domains/auth/controllers/authController.js` | Login/register/OAuth |
| `apps/coreknot/server/utils/authSession.js` | JWT issue/verify |
| `apps/coreknot/server/utils/pagePermissions.js` | Page keys + presets |
| `apps/coreknot/server/utils/departmentPermissions.js` | Department role helpers |
| `apps/api/src/common/auth/clerk-auth.guard.ts` | Target guard + bridge |
| `apps/api/src/common/auth/legacy-jwt.service.ts` | Legacy JWT verifier |
| `apps/api/src/common/auth/membership-context.service.ts` | Person/role resolution |
| `packages/permissions/src/index.ts` | `PlatformRole`, `hasPlatformRole` |
| `packages/database/prisma/schema.prisma` | `User`, `OrganizationMember`, `PersonIdentifier` |

---

## Agent 6 deliverables

| Deliverable | Status |
|-------------|--------|
| This document (`05-auth-migration.md`) | ✅ |
| Legacy JWT bridge shim in `@tsc/api` | ✅ (minimal v1) |
| Full cutover / Clerk webhooks / ETL | ⏸ Deferred — checklist only |
