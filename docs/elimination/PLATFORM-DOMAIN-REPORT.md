# Platform Domain Authority Report (Agent 06)

> **Date:** 2026-06-15  
> **Data map:** [DATA-OWNERSHIP-MAP.md](../architecture/DATA-OWNERSHIP-MAP.md)  
> **Verdict:** **Platform domains validated** — CoreKnot ops duplicates documented, not removed (prod safety).

---

## Before state

Platform API (`apps/api/src/app.module.ts`) registered both **authoritative Platform domains** and **transitional CoreKnot ops modules** against the same Prisma cluster.

### Platform-owned domains (correct)

| Domain | Module | Auth | Status |
|--------|--------|------|--------|
| Memberships | `MembershipModule` | `ClerkAuthGuard` + `RolesGuard` | ✅ Implemented |
| Rewards | `RewardsModule` | `ClerkAuthGuard` | ✅ Implemented |
| Marketplace | `MarketplaceModule` | `ClerkAuthGuard` | ✅ Scaffold + service |
| Events | `EventModule` | `ClerkAuthGuard` | ✅ Implemented |
| Event intelligence | `EventIntelligenceModule` | Alias controller | ✅ Platform scope |
| Fans / Audience | `FanModule`, `AudienceModule`, `AudienceOsModule` | `ClerkAuthGuard` | ✅ Implemented |
| Artists | `ArtistModule` | `ClerkAuthGuard` + `RolesGuard` | ✅ Implemented |
| Posts | `PostModule` | Health stub only | 🟡 Sprint stub |
| Community | `CommunityModule` | `ClerkAuthGuard` | ✅ Implemented |
| Feed | `FeedModule` | Health stub | 🟡 Sprint stub |
| Identity / Passport | `IdentityModule`, `PassportModule`, `TscIdentityModule` | Clerk | ✅ Platform scope |
| Graph / Search | `GraphModule`, `SearchModule` | Mixed | ✅ Platform scope |
| Opportunities | `OpportunityModule` | Clerk | ✅ Platform scope |

### CoreKnot-only domains (violation — transitional)

| Module | Prisma models | Platform API write | CoreKnot API write | Classification |
|--------|---------------|--------------------|--------------------|----------------|
| `CrmModule` | `Lead` | Yes | Yes (Mongo/Postgres) | **REMOVE from Platform** |
| `InquiriesModule` | `Inquiry` | Yes | Yes | **REMOVE** |
| `ProjectModule` | `Project` | Yes | Yes | **REMOVE** |
| `TaskModule` | `Task` | Yes | Yes | **REMOVE** |
| `WorkspaceModule` | `Workspace` | Yes | Yes | **REMOVE** |
| `GigsModule` | `Gig` | Yes | Yes | **REMOVE** |
| `FinanceModule` | `Expense`, finance docs | Yes | Yes | **REMOVE** |
| `InvoicesModule` | `Invoice` | Yes | Yes | **REMOVE** |
| `CalendarModule` | Content calendar | Yes | Yes | **REMOVE** |
| `ReleasesModule` | `Release` | Yes | Yes | **REMOVE** |
| `RoyaltiesModule` | `Royalty*` | Yes | Yes | **REMOVE** |
| `ContentModule` | `ContentItem` | Yes | Yes | **REMOVE** |
| `DistributionModule` | `Distribution*` | Yes | Yes | **REMOVE** |
| `IntegrationsModule` | `IntegrationConnection` | Yes | Yes | **REMOVE** |
| `AuditModule` | `AuditLog` | Yes | Yes | **REMOVE** |
| `CoreknotCompatModule` | N/A (route aliases) | Yes | N/A | **REMOVE** (gated in prod) |

Listed in `PLATFORM_COREKNOT_OPS_MODULES` constant (`platform-boundary.config.ts`).

## After state

| Action | Rationale |
|--------|-----------|
| **No module removal** | Partial removal breaks prod / E2E / compat clients |
| Compat routes gated | `CoreknotCompatGuard` — 410 Gone when disabled |
| CRM module documented | Sunset header in `crm.module.ts` |
| Ops module inventory exported | `PLATFORM_COREKNOT_OPS_MODULES` for CI/docs |

## Community frontend domain usage

| Surface | Data source | Platform API module target |
|---------|-------------|----------------------------|
| Feed, onboarding | Partial API via `@tsc/community-sdk` | `CommunityModule`, `IdentityModule` |
| Dashboard, opportunities, profile extras | **Mock** (`mock-data.ts`) | Should use `OpportunityModule`, `MembershipModule` |
| Identity resolve | `POST /identity/resolve` | `IdentityModule` ✅ |
| Person passport | Platform API | `PassportModule` ✅ |

## Dual-write risk

Platform `CrmModule` and CoreKnot CRM both mutate `Lead`. **Mitigation until sunset:**

1. CoreKnot Client → `api.coreknot.in` only (founder deploy + client env)
2. Platform compat disabled in prod (`PLATFORM_COREKNOT_COMPAT_ENABLED` unset + `NODE_ENV=production`)
3. No Website/Community CRM calls (verified — none in codebase)

## Risk

| Risk | Severity | Notes |
|------|----------|-------|
| Removing ops modules now | **Critical** | Would break typecheck consumers, compat layer, E2E |
| Continued dual ownership | High | Accept until Mongo sunset checklist complete |
| Post/Feed stubs | Medium | OpenAPI overstates capability |

## Rollback

Revert `CoreknotCompatGuard` and config files only — domain modules unchanged.

## Verification

```powershell
pnpm --filter @tsc/api typecheck
```

## P0 remaining (Agent 06 scope)

| ID | Item | Blocker |
|----|------|---------|
| A06-P0-1 | Remove CoreKnot ops modules from `app.module.ts` | Mongo sunset + CoreKnot API live |
| A06-P0-2 | Wire Community opportunities/dashboard to Platform API | H4 — separate sprint |
| A06-P0-3 | Implement `PostModule` / `FeedModule` beyond health stubs | Product sprint |
| A06-P0-4 | RBAC on `/admin`, `/audit`, `/analytics` | C6 in TECH-DEBT-ROADMAP |
