# Data Ownership Map

> Single Neon PostgreSQL cluster. Logical ownership — not separate databases.  
> Schema source: `packages/database/prisma/schema.prisma` (3279+ lines, audited 2026-06-15)

## Principles

1. **One `DATABASE_URL`** for Platform API and CoreKnot (when Postgres-enabled).
2. **Table owner** = the API that performs authoritative writes for that domain.
3. **Shared tables** — both products read; writes coordinated via owner API or explicit sync.
4. **Legacy bridge tables** (`CkLegacy*`) — migration artifacts; archive after Mongo sunset.

## Shared identity & org (Platform primary write)

| Model | Owner | Readers | Notes |
|-------|-------|---------|-------|
| `User` | Platform API | CoreKnot | Clerk-linked platform user |
| `Person` | Platform API | Both | Canonical person graph node |
| `Identity` | Platform API | Both | External identity links |
| `TscIdentity` | Platform API | Both | TSC passport identity |
| `PersonProfile` | Platform API | Both | |
| `PersonIdentifier` | Platform API | Both | Email, phone, social handles |
| `PersonRole` | Platform API | Both | |
| `IdentityMergeLog` | Platform API | Admin | |
| `Organization` | Platform API | Both | Orgs/workspaces for members |
| `OrganizationMember` | Platform API | Both | |
| `OrganizationTeam` | Platform API | Both | |
| `OrganizationTeamMember` | Platform API | Both | |
| `Workspace` | **CoreKnot** (ops) | Platform (read) | Internal project containers |
| `WorkspaceMember` | CoreKnot | Platform | |
| `WorkspaceTeam` | CoreKnot | Platform | |
| `Team` | Shared | Both | Context-dependent |
| Permission/RBAC | Platform API | Both | `@tsc/permissions` — no Prisma model yet |

## Community & public platform (Platform API only)

| Model | Domain |
|-------|--------|
| `Community`, `CommunityMember`, `CommunityPost` | Community |
| `Membership`, `MembershipSubscription` | Memberships |
| `Reward`, `RewardRedemption` | Rewards |
| `Event`, `EventParticipation`, `EventIntelligenceSnapshot` | Events |
| `MarketplaceListing` | Marketplace |
| `FanProfile`, `FanPurchase`, `ArtistFollow`, `SuperfanSnapshot` | Audience |
| `FanIntelligenceSnapshot`, `AudienceHealthSnapshot`, `CommunityAudienceSnapshot` | Audience OS |
| `Post`, `Feed`-related (`Activity`) | Social |
| `Opportunity`, `OpportunityApplication`, `Collaboration` | Opportunities |
| `Artist`, `ArtistPassport`, `Venue` | Artist graph |
| `Brand`, `Agency`, `Label`, `Deal`, `TrustSnapshot` | Industry |
| `Relationship` | Graph |
| `CommerceProduct`, `CommerceExperience`, `Ticket` | Commerce |
| `CreativeIdentity`, `Skill`, `SkillEndorsement` | Creative identity |
| `Notification` (member) | Platform notifications |
| `Message` | Messaging |
| `Search`/index metadata | Platform (Typesense external) |

## CoreKnot operations (CoreKnot API primary write)

| Model | Domain | Mongo source (legacy) |
|-------|--------|----------------------|
| `Lead` | CRM | `leads` collection |
| `Inquiry` | CRM | `artistinquiries` |
| `Project`, `ProjectMember` | Projects | `projects` |
| `Task`, `TaskAssignee`, `TaskComment`, `TaskChecklist` | Tasks | `tasks` |
| `Gig` | Operations | `artistgigs` |
| `Expense` | Finance | finance collections |
| `Contract`, `ContractTemplate` | Contracts | — |
| `Invoice`, `Escrow`, `Payout`, `Settlement` | Invoicing | import scripts |
| `Release`, `Royalty`, `RoyaltyStatement`, `RoyaltyLineItem` | Music ops | CoreKnot-specific |
| `ContentAsset`, `ContentItem` | Content calendar | CoreKnot |
| `DistributionChannel`, `DistributionSubmission`, `ReleaseTrack` | Distribution | CoreKnot |
| `IntegrationConnection` | Integrations | CoreKnot |
| `AuditLog` | Audit | CoreKnot + Platform admin |
| `AnalyticsMetricSnapshot` | Internal analytics | CoreKnot |

## Intelligence & automation (Platform API)

| Model | Notes |
|-------|-------|
| `Agent`, `AgentTask`, `AgentDecision`, `AgentRecommendation` | Platform intelligence |
| `AutomationRule`, `AutomationRun`, `AutonomousWorkflow` | Platform |
| `Forecast`, `Insight`, `Goal`, `GoalProgress` | Platform |
| `GeneratedOpportunity`, `OpportunityGenerationRun` | Platform |

## Legacy migration tables (archive target)

| Model | Purpose | Sunset |
|-------|---------|--------|
| `CkLegacyTenant` | Mongo tenant → Org mapping | After tenant store = postgres |
| `CkLegacyDepartment` | Dept mapping | Same |
| `CkLegacyStaffUser` | Staff user mapping | After auth store = postgres + Clerk |
| `CkLegacyDocument` | P1 domain blob mirror | After all `COREKNOT_*_STORE=postgres` |

Defined in `packages/database/prisma/schema.prisma` and fragment `coreknot-legacy-auth.prisma`.

## Mongo collections NOT yet in Prisma (CoreKnot-only)

~98 Mongo collections per [mongo-audit.md](../migration/mongo-audit.md). P1/P2 domains still Mongoose-only:

- Mail campaigns, attendance logs, gamification, newsletter, system logs
- Finance documents (GridFS attachments)
- Data hub sync state, QA runs, platform settings

**Action:** Continue ETL per `scripts/migrations/coreknot/` or add Prisma models + `COREKNOT_*_STORE=postgres`.

## Write authority matrix

| Operation | Authorized writer |
|-----------|-------------------|
| Member signup / profile | Platform API |
| Staff CRM lead update | CoreKnot API |
| Public event RSVP | Platform API |
| Internal task assignment | CoreKnot API |
| Marketplace listing publish | Platform API |
| Invoice import (Basecamp) | CoreKnot API |
| Org/team membership (Clerk) | Platform API (+ webhook) |

## Gap: dual write risk

Platform API modules (`CrmModule`, `TaskModule`, etc.) can write the same Prisma tables as CoreKnot migration targets. **Until sunset:**

- Treat CoreKnot API as authoritative for ops domains when `COREKNOT_*_STORE=postgres`
- Platform `CoreknotCompatModule` is read/compat only — no new features
- Reconcile with migration parity scripts: `pnpm migrate:coreknot:count-parity`

## Database operations

| Command | Scope |
|---------|-------|
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate` | Dev migrations (Platform) |
| `pnpm db:push` | Local schema push (dev only) |
| `pnpm migrate:coreknot:p0:execute` | ETL P0 domains to Postgres |

**Production:** Neon branch migrations via CI or controlled `prisma migrate deploy` — never `db push` on prod.

## Connection strings

| Environment | Pattern |
|-------------|---------|
| Local Docker | `postgresql://postgres:postgres@localhost:5432/tsc_community` |
| Neon prod | `postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require` |

Same cluster for Platform and CoreKnot — use Neon roles/branches for staging if needed.
