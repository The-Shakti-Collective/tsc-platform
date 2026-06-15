# Data Ownership Certificate (Agent 16)

> **Date:** 2026-06-15  
> **Cross-check:** [DATA-OWNERSHIP-MAP.md](../architecture/DATA-OWNERSHIP-MAP.md) vs `packages/database/prisma/schema.prisma`  
> **Verdict:** **FAIL** — 8 ambiguous tables, dual-write conflict on 6 CoreKnot domains, legacy bridge tables still required.

---

## Summary

| Owner | Model count | PASS | FAIL | AMBIG |
|-------|-------------|------|------|-------|
| Platform API | 78 | 76 | 0 | 2 |
| CoreKnot API | 28 | 22 | 0 | 6 |
| Shared (coordinated) | 12 | 10 | 0 | 2 |
| Legacy bridge | 4 | 4 | 0 | 0 |
| **Total** | **123** | **112** | **0** | **11** |

---

## Shared identity & org (Platform primary write)

| Table | Owner | Readers | PASS/FAIL | Notes |
|-------|-------|---------|-----------|-------|
| `User` | Platform | CoreKnot | ✅ PASS | Clerk-linked |
| `Person` | Platform | Both | ✅ PASS | Graph root |
| `Identity` | Platform | Both | ✅ PASS | |
| `TscIdentity` | Platform | Both | ✅ PASS | Passport |
| `PersonProfile` | Platform | Both | ✅ PASS | |
| `PersonIdentifier` | Platform | Both | ✅ PASS | |
| `PersonRole` | Platform | Both | ✅ PASS | |
| `IdentityMergeLog` | Platform | Admin | ✅ PASS | |
| `Organization` | Platform | Both | ✅ PASS | |
| `OrganizationMember` | Platform | Both | ✅ PASS | |
| `OrganizationTeam` | Platform | Both | ✅ PASS | |
| `OrganizationTeamMember` | Platform | Both | ✅ PASS | |
| `Workspace` | CoreKnot | Platform read | ⚠️ AMBIG | Doc says CoreKnot write; Platform `WorkspaceModule` also writes |
| `WorkspaceMember` | CoreKnot | Platform | ⚠️ AMBIG | Same dual-write |
| `WorkspaceTeam` | CoreKnot | Platform | ⚠️ AMBIG | Same |
| `Team` | — | — | ⚠️ AMBIG | **No Prisma model** — doc references `@tsc/permissions` only |

---

## Community & public platform (Platform API only)

| Table | Owner | PASS/FAIL |
|-------|-------|-----------|
| `Community`, `CommunityMember`, `CommunityPost` | Platform | ✅ |
| `Membership`, `MembershipSubscription` | Platform | ✅ |
| `Reward`, `RewardRedemption` | Platform | ✅ |
| `Event`, `EventParticipation`, `EventIntelligenceSnapshot` | Platform | ✅ |
| `MarketplaceListing` | Platform | ✅ |
| `FanProfile`, `FanPurchase`, `ArtistFollow`, `SuperfanSnapshot` | Platform | ✅ |
| `FanIntelligenceSnapshot`, `AudienceHealthSnapshot`, `CommunityAudienceSnapshot` | Platform | ✅ |
| `Post` | Platform | ✅ (API stub) |
| `Opportunity`, `OpportunityApplication`, `Collaboration` | Platform | ✅ |
| `Artist`, `ArtistPassport`, `Venue` | Platform | ✅ |
| `Brand`, `Agency`, `Label`, `Deal`, `TrustSnapshot` | Platform | ✅ |
| `Relationship` | Platform | ✅ |
| `CommerceProduct`, `CommerceExperience`, `Ticket` | Platform | ✅ |
| `CreativeIdentity`, `Skill`, `SkillEndorsement`, `CreativeIdentitySkill` | Platform | ✅ |
| `Notification` (member-facing) | Platform | ✅ |
| `Message` | Platform | ✅ |
| `Activity` | Platform | ✅ |
| `SupportAction` | Platform | ✅ |
| `EcosystemCredit`, `EcosystemCreditTransaction` | Platform | ✅ |
| `ReputationSnapshot` | Platform | ✅ |
| `BookingRequest` | Platform | ✅ |
| `Passport`-related via `ArtistPassport` | Platform | ✅ |

---

## CoreKnot operations (CoreKnot API primary write)

| Table | Owner | PASS/FAIL | Dual-write risk |
|-------|-------|-----------|-----------------|
| `Lead` | CoreKnot | ⚠️ AMBIG | Platform `CrmModule` + `CoreknotCompatModule` |
| `Inquiry` | CoreKnot | ⚠️ AMBIG | Platform `InquiriesModule` |
| `Project`, `ProjectMember` | CoreKnot | ⚠️ AMBIG | Platform `ProjectModule` |
| `Task`, `TaskAssignee`, `TaskComment`, `TaskChecklist` | CoreKnot | ⚠️ AMBIG | Platform `TaskModule` |
| `Gig` | CoreKnot | ⚠️ AMBIG | Platform `GigsModule` |
| `Expense` | CoreKnot | ⚠️ AMBIG | Platform `FinanceModule` |
| `Contract`, `ContractTemplate` | CoreKnot | ✅ PASS | Platform read via `ContractModule` |
| `Invoice`, `Escrow`, `Payout`, `Settlement` | CoreKnot | ✅ PASS | Platform `InvoicesModule`/`PaymentModule` — artist-facing |
| `Release`, `Royalty`, `RoyaltyStatement`, `RoyaltyLineItem` | CoreKnot | ✅ PASS | |
| `ReleaseTrack`, `DistributionChannel`, `DistributionSubmission` | CoreKnot | ✅ PASS | |
| `ContentAsset`, `ContentItem` | CoreKnot | ✅ PASS | |
| `IntegrationConnection` | CoreKnot | ✅ PASS | |
| `AuditLog` | Both | ⚠️ AMBIG | Platform `AuditModule` + CoreKnot audit |
| `AnalyticsMetricSnapshot` | Both | ⚠️ AMBIG | Platform analytics + CoreKnot internal |

---

## Intelligence & automation (Platform API)

| Table | PASS/FAIL |
|-------|-----------|
| `Agent`, `AgentTask`, `AgentDecision`, `AgentRecommendation` | ✅ |
| `AutomationRule`, `AutomationRun`, `AutonomousWorkflow`, `AutonomousWorkflowRun` | ✅ |
| `Forecast`, `ForecastSnapshot`, `Insight`, `InsightAction` | ✅ |
| `Goal`, `GoalProgress` | ✅ |
| `GeneratedOpportunity`, `OpportunityGenerationRun` | ✅ |

---

## Platform infra / public API

| Table | Owner | PASS/FAIL |
|-------|-------|-----------|
| `ApiKey`, `WebhookSubscription`, `WebhookDelivery` | Platform | ✅ |
| `DataExchangePartner`, `WhiteLabelTenant` | Platform | ✅ |
| `SyncMapping`, `SyncEventReceipt` | Platform | ✅ |

---

## Legacy migration tables

| Table | Owner | PASS/FAIL | Sunset |
|-------|-------|-----------|--------|
| `CkLegacyTenant` | Migration | ✅ PASS | After tenant store = postgres |
| `CkLegacyDepartment` | Migration | ✅ PASS | Same |
| `CkLegacyStaffUser` | Migration | ✅ PASS | After Clerk on CoreKnot |
| `CkLegacyDocument` | Migration | ✅ PASS | After all domain stores = postgres |

---

## Mongo collections NOT in Prisma (~98)

Per [MONGO-SUNSET-REPORT.md](../architecture/MONGO-SUNSET-REPORT.md): mail campaigns, attendance, gamification, newsletter, system logs, GridFS attachments, data hub sync — **CoreKnot-only, no Postgres owner yet**.

---

## Ambiguous tables (must resolve before PASS)

| # | Table | Issue | Resolution |
|---|-------|-------|------------|
| 1 | `Workspace*` | Platform and CoreKnot both write | CoreKnot authoritative; deprecate Platform writes post-cutover |
| 2 | `Lead`, `Inquiry` | Platform CRM modules active | Sunset Platform writes; webhook-only from Website |
| 3 | `Project`, `Task*` | Platform project/task modules | Same |
| 4 | `Gig`, `Expense` | Platform finance/gigs modules | Same |
| 5 | `AuditLog` | Two writers | Split by `source` field or separate tables |
| 6 | `AnalyticsMetricSnapshot` | Two writers | Namespace by `metricKey` prefix |
| 7 | `Team` | Documented but no Prisma model | Add model or remove from ownership map |
| 8 | `Artist` | Platform + CoreKnot artist domains | Platform owns member artists; CoreKnot owns roster CRM |

---

## Certification

| Criterion | Result |
|-----------|--------|
| Every table has single authoritative writer | ❌ |
| Matches DATA-OWNERSHIP-MAP | ⚠️ Mostly |
| No dual-write without flag | ❌ |

**Agent 16 verdict: FAIL**
