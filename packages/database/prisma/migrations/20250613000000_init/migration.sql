-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GraphEntityType" AS ENUM ('Artist', 'Venue', 'Curator', 'Brand', 'Agency', 'Label', 'Organization', 'Person', 'Festival', 'Event', 'Community', 'Membership', 'CreativeIdentity', 'Skill');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('MANAGES', 'COLLABORATED_WITH', 'ATTENDED', 'MEMBER_OF', 'PERFORMED_AT', 'BOOKED_BY', 'FOLLOWS', 'MENTORED_BY', 'SPONSORED_BY', 'WORKED_WITH', 'REFERRED_BY', 'SIGNED_TO', 'SUPPORTED', 'SUBSCRIBED', 'PURCHASED', 'REFERRED', 'HAS_SKILL');

-- CreateEnum
CREATE TYPE "FanIntelligenceTier" AS ENUM ('super', 'active', 'casual', 'dormant');

-- CreateEnum
CREATE TYPE "BrandStatus" AS ENUM ('active', 'pending', 'archived');

-- CreateEnum
CREATE TYPE "BrandBudgetRange" AS ENUM ('under_5l', 'five_to_25l', 'twenty_five_to_1cr', 'over_1cr', 'undisclosed');

-- CreateEnum
CREATE TYPE "TrustEntityType" AS ENUM ('Artist', 'Brand', 'Agency');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('application', 'discussion', 'negotiation', 'agreement', 'completed', 'paid');

-- CreateEnum
CREATE TYPE "RevenueTransactionType" AS ENUM ('expected', 'received', 'pending');

-- CreateEnum
CREATE TYPE "IdentifierProvider" AS ENUM ('email', 'phone', 'instagram', 'spotify', 'tiktok', 'twitter', 'community_account', 'coreknot_user', 'website', 'other');

-- CreateEnum
CREATE TYPE "PersonRoleType" AS ENUM ('artist', 'manager', 'fan', 'community_leader', 'booker', 'curator', 'brand_rep', 'organizer', 'other');

-- CreateEnum
CREATE TYPE "PersonRoleStatus" AS ENUM ('active', 'inactive', 'pending');

-- CreateEnum
CREATE TYPE "IdentityMergeReason" AS ENUM ('manual', 'auto_match', 'sync_reconcile', 'admin_override');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('joined_community', 'left_community', 'registered_event', 'checked_in_event', 'posted_collaboration', 'applied_collaboration', 'applied_opportunity', 'won_opportunity', 'launched_opportunity', 'followed_person', 'unfollowed_person', 'updated_profile', 'created_brand', 'created_agency', 'created_label', 'reviewed_application', 'hired_artist', 'deal_created', 'deal_completed', 'deal_paid', 'purchased_product', 'agent_recommendation_created', 'career_actions_generated', 'career_action_dismissed', 'community_agent_suggestions_generated', 'community_suggestion_approved', 'community_suggestion_dismissed', 'event_agent_insights_generated', 'event_suggestion_approved', 'event_suggestion_dismissed', 'brand_match_run_completed', 'brand_match_invite_sent', 'talent_discovery_scan_completed', 'talent_discovery_alert_acknowledged', 'forecast_generated', 'insight_action_executed', 'automation_rule_evaluated', 'automation_action_stubbed', 'copilot_query_answered', 'autonomous_workflow_started', 'autonomous_workflow_step_completed', 'autonomous_workflow_approved', 'autonomous_workflow_completed', 'autonomous_workflow_cancelled', 'opportunity_generated', 'opportunity_generation_published', 'workspace_created', 'workspace_member_added', 'project_created', 'task_created', 'task_completed', 'creative_identity_created', 'creative_role_added', 'skill_added', 'skill_endorsed', 'tracked_listing');

-- CreateEnum
CREATE TYPE "GeneratedOpportunitySource" AS ENUM ('system', 'brand', 'community');

-- CreateEnum
CREATE TYPE "GeneratedOpportunityStatus" AS ENUM ('draft', 'pending_approval', 'published', 'dismissed');

-- CreateEnum
CREATE TYPE "GeneratedOpportunityType" AS ENUM ('showcase_event', 'collaboration_open_call', 'grant_opportunity');

-- CreateEnum
CREATE TYPE "ActivityVisibility" AS ENUM ('public', 'followers', 'private');

-- CreateEnum
CREATE TYPE "CommunityMemberRole" AS ENUM ('Founder', 'Admin', 'Moderator', 'Contributor', 'Member');

-- CreateEnum
CREATE TYPE "CommunityMemberStatus" AS ENUM ('active', 'left', 'banned', 'pending');

-- CreateEnum
CREATE TYPE "EventParticipationRole" AS ENUM ('Attendee', 'Artist', 'Volunteer', 'Organizer', 'Judge', 'Speaker');

-- CreateEnum
CREATE TYPE "EventParticipationStatus" AS ENUM ('registered', 'checked_in', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "CollaborationType" AS ENUM ('need_rapper', 'need_producer', 'need_guitarist', 'need_videographer', 'need_cover_artist', 'general');

-- CreateEnum
CREATE TYPE "CollaborationStatus" AS ENUM ('open', 'filled', 'closed', 'expired');

-- CreateEnum
CREATE TYPE "CollaborationApplicationStatus" AS ENUM ('applied', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "OpportunityCategory" AS ENUM ('scholarship', 'residency', 'brand_deal', 'festival_slot', 'workshop', 'collaboration', 'open_call', 'funding');

-- CreateEnum
CREATE TYPE "OpportunityApplicationStatus" AS ENUM ('saved', 'applied', 'shortlisted', 'won', 'rejected');

-- CreateEnum
CREATE TYPE "SyncSourceSystem" AS ENUM ('coreknot', 'tsc');

-- CreateEnum
CREATE TYPE "SyncEventReceiptStatus" AS ENUM ('processed', 'duplicate', 'failed');

-- CreateEnum
CREATE TYPE "ReputationEntityType" AS ENUM ('Person', 'Artist', 'Community');

-- CreateEnum
CREATE TYPE "SuperfanTier" AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'legend');

-- CreateEnum
CREATE TYPE "MembershipBenefit" AS ENUM ('early_access', 'private_events', 'meetups', 'discounts', 'exclusive_content');

-- CreateEnum
CREATE TYPE "MembershipProgramTier" AS ENUM ('standard', 'plus', 'premium', 'circle', 'collective');

-- CreateEnum
CREATE TYPE "MembershipSubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'pending');

-- CreateEnum
CREATE TYPE "SupportTargetType" AS ENUM ('Artist', 'Community', 'Event');

-- CreateEnum
CREATE TYPE "SupportActionType" AS ENUM ('buy_ticket', 'buy_membership', 'buy_workshop', 'buy_experience', 'general_support');

-- CreateEnum
CREATE TYPE "SupportActionStatus" AS ENUM ('recorded', 'pending_payment');

-- CreateEnum
CREATE TYPE "CommerceCatalogStatus" AS ENUM ('active', 'inactive', 'sold_out');

-- CreateEnum
CREATE TYPE "CommerceProductType" AS ENUM ('physical_merch', 'sample_pack', 'digital_download');

-- CreateEnum
CREATE TYPE "CommerceExperienceType" AS ENUM ('vip_meet_greet', 'workshop', 'backstage', 'community_pass');

-- CreateEnum
CREATE TYPE "FanPurchaseProductType" AS ENUM ('ticket', 'merch', 'experience');

-- CreateEnum
CREATE TYPE "FanPurchaseStatus" AS ENUM ('recorded', 'pending_payment');

-- CreateEnum
CREATE TYPE "RewardCategory" AS ENUM ('merch', 'tickets', 'meet_greet', 'community_access', 'priority_application');

-- CreateEnum
CREATE TYPE "RewardRedemptionStatus" AS ENUM ('pending', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "MarketplaceListingType" AS ENUM ('brand_campaign', 'festival_slot', 'opening_act', 'workshop', 'grant', 'residency', 'sync_licensing', 'collaboration');

-- CreateEnum
CREATE TYPE "MarketplaceOwnerType" AS ENUM ('brand', 'agency', 'artist');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('opportunity', 'career', 'community', 'event', 'brand_match', 'talent_discovery', 'forecast', 'copilot', 'workflow');

-- CreateEnum
CREATE TYPE "AgentTaskStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AgentDecisionStatus" AS ENUM ('pending', 'approved', 'rejected', 'executed');

-- CreateEnum
CREATE TYPE "AgentRecommendationStatus" AS ENUM ('pending', 'active', 'dismissed', 'applied', 'expired');

-- CreateEnum
CREATE TYPE "ForecastMetric" AS ENUM ('revenue', 'attendance', 'growth', 'demand', 'membership_churn');

-- CreateEnum
CREATE TYPE "ForecastHorizon" AS ENUM ('d30', 'd90');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "InsightActionStatus" AS ENUM ('pending', 'executed', 'failed');

-- CreateEnum
CREATE TYPE "AutomationRuleStatus" AS ENUM ('active', 'paused', 'disabled');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "AutomationTriggerType" AS ENUM ('artist_path', 'booking_inquiry', 'workshop_lead', 'health_below', 'churn_above', 'deal_stale', 'superfan_drop');

-- CreateEnum
CREATE TYPE "GoalEntityType" AS ENUM ('Artist', 'Organization', 'Community', 'Person', 'Venue', 'Platform');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom');

-- CreateEnum
CREATE TYPE "AutonomousWorkflowTriggerType" AS ENUM ('manual', 'campaign_created', 'insight_action', 'schedule');

-- CreateEnum
CREATE TYPE "AutonomousWorkflowStatus" AS ENUM ('active', 'draft', 'archived');

-- CreateEnum
CREATE TYPE "AutonomousWorkflowRunStatus" AS ENUM ('pending', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "TscIdentityNamespace" AS ENUM ('artist', 'community', 'brand', 'fan', 'creator');

-- CreateEnum
CREATE TYPE "TscIdentityEntityType" AS ENUM ('Artist', 'Community', 'Brand', 'Person', 'Venue');

-- CreateEnum
CREATE TYPE "TscVerificationBadge" AS ENUM ('verified_artist', 'verified_community', 'verified_venue', 'verified_brand_partner');

-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('inquiry', 'matched', 'negotiating', 'contracted', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ContractTemplateType" AS ENUM ('brand_deal', 'performance', 'workshop', 'community');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'sent', 'signed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('razorpay', 'stripe', 'cashfree', 'manual');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('pending', 'holding', 'released', 'cancelled');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('scheduled', 'processing', 'paid', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('draft', 'pending', 'settled', 'cancelled');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "WhiteLabelTenantType" AS ENUM ('agency', 'community', 'festival');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('pending', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "DataExchangeSyncDirection" AS ENUM ('inbound', 'outbound', 'bidirectional');

-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('artist', 'manager', 'team', 'community_leader', 'agency', 'personal');

-- CreateEnum
CREATE TYPE "WorkspaceMemberRole" AS ENUM ('owner', 'admin', 'member', 'guest');

-- CreateEnum
CREATE TYPE "WorkspaceMemberStatus" AS ENUM ('active', 'invited', 'removed');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('album', 'tour', 'festival', 'community_campaign', 'brand_campaign', 'music_video', 'general');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "ProjectMemberRole" AS ENUM ('owner', 'lead', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'blocked', 'done');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "CreativeVertical" AS ENUM ('music', 'film', 'photography', 'podcast', 'comedy', 'dance', 'content');

-- CreateEnum
CREATE TYPE "CreativeRoleTag" AS ENUM ('photographer', 'videographer', 'artist', 'producer', 'manager', 'founder', 'community_leader');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('production', 'performance', 'visual', 'management', 'technical', 'marketing');

-- CreateEnum
CREATE TYPE "SkillProficiency" AS ENUM ('learning', 'intermediate', 'expert');

-- CreateEnum
CREATE TYPE "SkillEndorsementSource" AS ENUM ('peer', 'project', 'system');

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "sourceEntityType" "GraphEntityType" NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityType" "GraphEntityType" NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "strength" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "city" TEXT,
    "country" TEXT,
    "logo" TEXT,
    "description" TEXT,
    "budgetRange" "BrandBudgetRange",
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "BrandStatus" NOT NULL DEFAULT 'active',
    "trustScore" DOUBLE PRECISION,
    "personId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "city" TEXT,
    "teamSize" INTEGER,
    "personId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genre" TEXT,
    "website" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustSnapshot" (
    "id" TEXT NOT NULL,
    "entityType" "TrustEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustScore" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL DEFAULT '{}',
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rankPercentile" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "displayName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanProfile" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "favoriteGenres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favoriteArtists" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "influenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FanProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistFollow" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperfanSnapshot" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "artistId" TEXT,
    "superfanScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier" "SuperfanTier" NOT NULL DEFAULT 'bronze',
    "factors" JSONB NOT NULL DEFAULT '{}',
    "snapshotDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperfanSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceHealthSnapshot" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "audienceGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "audienceChurn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fanRetention" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fanConversion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lifetimeValueStub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudienceHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityAudienceSnapshot" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "memberGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeMembers" INTEGER NOT NULL DEFAULT 0,
    "membershipRevenueStub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fanGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eventConversion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityAudienceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanIntelligenceSnapshot" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "artistId" TEXT,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "influenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loyaltyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier" "FanIntelligenceTier" NOT NULL DEFAULT 'casual',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "snapshotDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FanIntelligenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonProfile" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "username" TEXT,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "city" TEXT,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "links" JSONB NOT NULL DEFAULT '[]',
    "verificationLevel" INTEGER NOT NULL DEFAULT 0,
    "reputationScore" DOUBLE PRECISION,
    "ecosystemScore" DOUBLE PRECISION,
    "adminVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonVerificationRequest" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonIdentifier" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "provider" "IdentifierProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "normalizedId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonRole" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "PersonRoleType" NOT NULL,
    "status" "PersonRoleStatus" NOT NULL DEFAULT 'active',
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityMergeLog" (
    "id" TEXT NOT NULL,
    "survivorPersonId" TEXT NOT NULL,
    "mergedPersonId" TEXT NOT NULL,
    "reason" "IdentityMergeReason" NOT NULL,
    "matchSignals" JSONB,
    "conflictResolutions" JSONB,
    "mergedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityMergeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonFollow" (
    "id" TEXT NOT NULL,
    "followerPersonId" TEXT NOT NULL,
    "followingPersonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "actorPersonId" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibility" "ActivityVisibility" NOT NULL DEFAULT 'public',

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "personId" TEXT,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "photoUrl" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistPassport" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "showHealthScore" BOOLEAN NOT NULL DEFAULT true,
    "showCommunityScore" BOOLEAN NOT NULL DEFAULT true,
    "showActivityScore" BOOLEAN NOT NULL DEFAULT true,
    "showOpportunityHistory" BOOLEAN NOT NULL DEFAULT false,
    "showCareerGraph" BOOLEAN NOT NULL DEFAULT true,
    "headline" TEXT,
    "bio" TEXT,
    "photoUrl" TEXT,
    "links" JSONB NOT NULL DEFAULT '[]',
    "cachedEcosystemScore" DOUBLE PRECISION,
    "ecosystemScoreUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistPassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "capacity" INTEGER,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "artistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "tier" "MembershipProgramTier" NOT NULL DEFAULT 'standard',
    "benefits" "MembershipBenefit"[] DEFAULT ARRAY[]::"MembershipBenefit"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipSubscription" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "status" "MembershipSubscriptionStatus" NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportAction" (
    "id" TEXT NOT NULL,
    "supporterPersonId" TEXT NOT NULL,
    "targetType" "SupportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "actionType" "SupportActionType" NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'INR',
    "status" "SupportActionStatus" NOT NULL DEFAULT 'recorded',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "quantity" INTEGER NOT NULL,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CommerceCatalogStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceProduct" (
    "id" TEXT NOT NULL,
    "artistId" TEXT,
    "communityId" TEXT,
    "name" TEXT NOT NULL,
    "type" "CommerceProductType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "inventory" INTEGER,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CommerceCatalogStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceExperience" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CommerceExperienceType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "slots" INTEGER NOT NULL,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CommerceCatalogStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanPurchase" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "productType" "FanPurchaseProductType" NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "FanPurchaseStatus" NOT NULL DEFAULT 'recorded',
    "supportActionId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FanPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creditCost" INTEGER NOT NULL,
    "category" "RewardCategory" NOT NULL,
    "stock" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "creditCost" INTEGER NOT NULL,
    "status" "RewardRedemptionStatus" NOT NULL DEFAULT 'pending',
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMember" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "CommunityMemberRole" NOT NULL DEFAULT 'Member',
    "status" "CommunityMemberStatus" NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityIntelligenceSnapshot" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "growth" DOUBLE PRECISION,
    "retention" DOUBLE PRECISION,
    "churn" DOUBLE PRECISION,
    "superFanCount" INTEGER,
    "dormantCount" INTEGER,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityIntelligenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "city" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "artistId" TEXT,
    "venueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventIntelligenceSnapshot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "predictedAttendance" DOUBLE PRECISION,
    "actualAttendance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "predictedRevenueStub" DOUBLE PRECISION,
    "actualRevenueStub" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "audienceGrowthImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communityImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fanDensityByCity" JSONB NOT NULL DEFAULT '{}',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventIntelligenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "EventParticipationRole" NOT NULL DEFAULT 'Attendee',
    "status" "EventParticipationStatus" NOT NULL DEFAULT 'registered',
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL,
    "creatorPersonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CollaborationType" NOT NULL,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "city" TEXT,
    "status" "CollaborationStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Collaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationApplication" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "applicantPersonId" TEXT NOT NULL,
    "message" TEXT,
    "status" "CollaborationApplicationStatus" NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "OpportunityCategory" NOT NULL,
    "city" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "value" DECIMAL(65,30),
    "source" TEXT,
    "organizationId" TEXT,
    "marketplaceVisible" BOOLEAN NOT NULL DEFAULT true,
    "listingType" "MarketplaceListingType",
    "ownerType" "MarketplaceOwnerType",
    "ownerId" TEXT,
    "budget" DECIMAL(65,30),
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "genre" TEXT,
    "brandId" TEXT,
    "agencyId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityApplication" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "artistId" TEXT,
    "status" "OpportunityApplicationStatus" NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "OpportunityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityActivity" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "personId" TEXT,
    "type" TEXT NOT NULL,
    "summary" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "applicationId" TEXT,
    "artistId" TEXT NOT NULL,
    "brandId" TEXT,
    "agencyId" TEXT,
    "status" "DealStatus" NOT NULL DEFAULT 'discussion',
    "value" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "negotiationNotes" TEXT,
    "agreementUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueTransaction" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "RevenueTransactionType" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "RevenueTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncMapping" (
    "id" TEXT NOT NULL,
    "sourceSystem" "SyncSourceSystem" NOT NULL,
    "externalId" TEXT NOT NULL,
    "tscEntityType" TEXT NOT NULL,
    "tscEntityId" TEXT NOT NULL,
    "eventType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncEventReceipt" (
    "id" TEXT NOT NULL,
    "sourceSystem" "SyncSourceSystem" NOT NULL,
    "externalId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "SyncEventReceiptStatus" NOT NULL DEFAULT 'processed',
    "result" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncEventReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationSnapshot" (
    "id" TEXT NOT NULL,
    "entityType" "ReputationEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "artistReputation" DOUBLE PRECISION,
    "communityReputation" DOUBLE PRECISION,
    "organizerReputation" DOUBLE PRECISION,
    "scores" JSONB NOT NULL DEFAULT '{}',
    "overallScore" DOUBLE PRECISION NOT NULL,
    "rankPercentile" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemCredit" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcosystemCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemCreditTransaction" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcosystemCreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "AgentTaskStatus" NOT NULL DEFAULT 'pending',
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentDecision" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "AgentDecisionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metric" "ForecastMetric" NOT NULL,
    "horizon" "ForecastHorizon" NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'linear_run_rate_v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "forecastId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "lowerBound" DOUBLE PRECISION NOT NULL,
    "upperBound" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ForecastSnapshot_pkey" PRIMARY KEY ("forecastId","snapshotDate")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "InsightSeverity" NOT NULL DEFAULT 'info',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightAction" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" "InsightActionStatus" NOT NULL DEFAULT 'pending',
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "InsightAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRecommendation" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "targetPersonId" TEXT,
    "targetArtistId" TEXT,
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "AgentRecommendationStatus" NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistHealthSnapshot" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dimensions" JSONB NOT NULL DEFAULT '{}',
    "riskAlerts" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL,
    "triggerType" "AutomationTriggerType" NOT NULL DEFAULT 'artist_path',
    "trigger" JSONB NOT NULL DEFAULT '{}',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "status" "AutomationRuleStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'running',
    "trigger" JSONB NOT NULL DEFAULT '{}',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "result" JSONB NOT NULL DEFAULT '{}',
    "opportunityId" TEXT,
    "personId" TEXT,
    "communityId" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "entityType" "GoalEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" "GoalPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalProgress" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "GoalProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomousWorkflow" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" "AutonomousWorkflowTriggerType" NOT NULL DEFAULT 'manual',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "status" "AutonomousWorkflowStatus" NOT NULL DEFAULT 'active',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutonomousWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomousWorkflowRun" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "AutonomousWorkflowRunStatus" NOT NULL DEFAULT 'pending',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "stepsLog" JSONB NOT NULL DEFAULT '[]',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "result" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AutonomousWorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TscIdentity" (
    "id" TEXT NOT NULL,
    "entityType" "TscIdentityEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "namespace" "TscIdentityNamespace" NOT NULL,
    "slug" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "verifiedBadge" "TscVerificationBadge",
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TscIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL,
    "requesterPersonId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "venueId" TEXT,
    "eventDate" TIMESTAMP(3),
    "budget" DECIMAL(65,30),
    "message" TEXT,
    "status" "BookingRequestStatus" NOT NULL DEFAULT 'inquiry',
    "dealId" TEXT,
    "opportunityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ContractTemplateType" NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "dealId" TEXT,
    "bookingRequestId" TEXT,
    "artistId" TEXT NOT NULL,
    "brandId" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'draft',
    "signedAt" TIMESTAMP(3),
    "documentUrl" TEXT,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "dealId" TEXT,
    "bookingRequestId" TEXT,
    "artistId" TEXT NOT NULL,
    "brandId" TEXT,
    "amount" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentProvider" "PaymentProvider",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "dealId" TEXT,
    "contractId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "EscrowStatus" NOT NULL DEFAULT 'pending',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'razorpay',
    "externalId" TEXT,
    "heldAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "artistId" TEXT,
    "personId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PayoutStatus" NOT NULL DEFAULT 'scheduled',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'razorpay',
    "externalId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "SettlementStatus" NOT NULL DEFAULT 'draft',
    "payoutIds" JSONB NOT NULL DEFAULT '[]',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ownerOrgId" TEXT,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSubscription" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "responseCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExchangePartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "allowedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "syncDirection" "DataExchangeSyncDirection" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataExchangePartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelTenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WhiteLabelTenantType" NOT NULL,
    "customDomain" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "apiKeyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerPersonId" TEXT NOT NULL,
    "type" "WorkspaceType" NOT NULL,
    "creativeIdentityId" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "WorkspaceMemberRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "WorkspaceMemberStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceTeam" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'planning',
    "budget" DOUBLE PRECISION,
    "currency" TEXT,
    "timelineStart" TIMESTAMP(3),
    "timelineEnd" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "projectId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "ProjectMemberRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","personId")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "dueAt" TIMESTAMP(3),
    "createdByPersonId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "taskId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("taskId","personId")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorPersonId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskChecklist" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TaskChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedOpportunity" (
    "id" TEXT NOT NULL,
    "source" "GeneratedOpportunitySource" NOT NULL DEFAULT 'system',
    "generationReason" TEXT NOT NULL,
    "signalSnapshot" JSONB NOT NULL DEFAULT '{}',
    "suggestedType" "GeneratedOpportunityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "genre" TEXT,
    "targetEntityType" TEXT,
    "targetEntityId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "GeneratedOpportunityStatus" NOT NULL DEFAULT 'draft',
    "opportunityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "GeneratedOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityGenerationRun" (
    "id" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "signals" JSONB NOT NULL DEFAULT '{}',
    "generatedCount" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityGenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeIdentity" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "primaryCity" TEXT,
    "verticals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "verificationLevel" INTEGER NOT NULL DEFAULT 0,
    "trustScoreStub" DOUBLE PRECISION,
    "ecosystemScoreStub" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeIdentitySkill" (
    "creativeIdentityId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" "SkillProficiency" NOT NULL,
    "yearsExperience" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeIdentitySkill_pkey" PRIMARY KEY ("creativeIdentityId","skillId")
);

-- CreateTable
CREATE TABLE "SkillEndorsement" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "creativeIdentityId" TEXT NOT NULL,
    "endorserPersonId" TEXT,
    "source" "SkillEndorsementSource" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relationship_sourceEntityType_sourceEntityId_idx" ON "Relationship"("sourceEntityType", "sourceEntityId");

-- CreateIndex
CREATE INDEX "Relationship_targetEntityType_targetEntityId_idx" ON "Relationship"("targetEntityType", "targetEntityId");

-- CreateIndex
CREATE INDEX "Relationship_relationshipType_idx" ON "Relationship"("relationshipType");

-- CreateIndex
CREATE INDEX "Relationship_effectiveFrom_effectiveTo_idx" ON "Relationship"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_sourceEntityType_sourceEntityId_targetEntityTy_key" ON "Relationship"("sourceEntityType", "sourceEntityId", "targetEntityType", "targetEntityId", "relationshipType");

-- CreateIndex
CREATE INDEX "Brand_status_verified_idx" ON "Brand"("status", "verified");

-- CreateIndex
CREATE INDEX "Brand_industry_idx" ON "Brand"("industry");

-- CreateIndex
CREATE INDEX "Brand_city_idx" ON "Brand"("city");

-- CreateIndex
CREATE INDEX "Brand_personId_idx" ON "Brand"("personId");

-- CreateIndex
CREATE INDEX "Agency_city_idx" ON "Agency"("city");

-- CreateIndex
CREATE INDEX "Agency_personId_idx" ON "Agency"("personId");

-- CreateIndex
CREATE INDEX "Label_genre_idx" ON "Label"("genre");

-- CreateIndex
CREATE INDEX "Label_city_idx" ON "Label"("city");

-- CreateIndex
CREATE INDEX "TrustSnapshot_entityType_entityId_snapshotDate_idx" ON "TrustSnapshot"("entityType", "entityId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "TrustSnapshot_entityType_trustScore_idx" ON "TrustSnapshot"("entityType", "trustScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TrustSnapshot_entityType_entityId_snapshotDate_key" ON "TrustSnapshot"("entityType", "entityId", "snapshotDate");

-- CreateIndex
CREATE INDEX "Person_mergedIntoId_idx" ON "Person"("mergedIntoId");

-- CreateIndex
CREATE INDEX "Person_email_idx" ON "Person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FanProfile_personId_key" ON "FanProfile"("personId");

-- CreateIndex
CREATE INDEX "FanProfile_engagementScore_idx" ON "FanProfile"("engagementScore" DESC);

-- CreateIndex
CREATE INDEX "ArtistFollow_artistId_followedAt_idx" ON "ArtistFollow"("artistId", "followedAt" DESC);

-- CreateIndex
CREATE INDEX "ArtistFollow_personId_idx" ON "ArtistFollow"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistFollow_personId_artistId_key" ON "ArtistFollow"("personId", "artistId");

-- CreateIndex
CREATE INDEX "SuperfanSnapshot_personId_snapshotDate_idx" ON "SuperfanSnapshot"("personId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "SuperfanSnapshot_artistId_superfanScore_idx" ON "SuperfanSnapshot"("artistId", "superfanScore" DESC);

-- CreateIndex
CREATE INDEX "SuperfanSnapshot_artistId_tier_idx" ON "SuperfanSnapshot"("artistId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "SuperfanSnapshot_personId_artistId_snapshotDate_key" ON "SuperfanSnapshot"("personId", "artistId", "snapshotDate");

-- CreateIndex
CREATE INDEX "AudienceHealthSnapshot_artistId_snapshotDate_idx" ON "AudienceHealthSnapshot"("artistId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "AudienceHealthSnapshot_audienceGrowth_idx" ON "AudienceHealthSnapshot"("audienceGrowth" DESC);

-- CreateIndex
CREATE INDEX "AudienceHealthSnapshot_fanRetention_idx" ON "AudienceHealthSnapshot"("fanRetention" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AudienceHealthSnapshot_artistId_snapshotDate_key" ON "AudienceHealthSnapshot"("artistId", "snapshotDate");

-- CreateIndex
CREATE INDEX "CommunityAudienceSnapshot_communityId_snapshotDate_idx" ON "CommunityAudienceSnapshot"("communityId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "CommunityAudienceSnapshot_memberGrowth_idx" ON "CommunityAudienceSnapshot"("memberGrowth" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityAudienceSnapshot_communityId_snapshotDate_key" ON "CommunityAudienceSnapshot"("communityId", "snapshotDate");

-- CreateIndex
CREATE INDEX "FanIntelligenceSnapshot_personId_snapshotDate_idx" ON "FanIntelligenceSnapshot"("personId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "FanIntelligenceSnapshot_artistId_engagementScore_idx" ON "FanIntelligenceSnapshot"("artistId", "engagementScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "FanIntelligenceSnapshot_personId_artistId_snapshotDate_key" ON "FanIntelligenceSnapshot"("personId", "artistId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "PersonProfile_personId_key" ON "PersonProfile"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonProfile_username_key" ON "PersonProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PersonProfile_slug_key" ON "PersonProfile"("slug");

-- CreateIndex
CREATE INDEX "PersonProfile_slug_idx" ON "PersonProfile"("slug");

-- CreateIndex
CREATE INDEX "PersonProfile_username_idx" ON "PersonProfile"("username");

-- CreateIndex
CREATE INDEX "PersonVerificationRequest_personId_type_status_idx" ON "PersonVerificationRequest"("personId", "type", "status");

-- CreateIndex
CREATE INDEX "PersonIdentifier_personId_idx" ON "PersonIdentifier"("personId");

-- CreateIndex
CREATE INDEX "PersonIdentifier_provider_normalizedId_idx" ON "PersonIdentifier"("provider", "normalizedId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonIdentifier_provider_externalId_key" ON "PersonIdentifier"("provider", "externalId");

-- CreateIndex
CREATE INDEX "PersonRole_personId_status_idx" ON "PersonRole"("personId", "status");

-- CreateIndex
CREATE INDEX "PersonRole_role_entityType_entityId_idx" ON "PersonRole"("role", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "IdentityMergeLog_survivorPersonId_idx" ON "IdentityMergeLog"("survivorPersonId");

-- CreateIndex
CREATE INDEX "IdentityMergeLog_mergedPersonId_idx" ON "IdentityMergeLog"("mergedPersonId");

-- CreateIndex
CREATE INDEX "PersonFollow_followerPersonId_idx" ON "PersonFollow"("followerPersonId");

-- CreateIndex
CREATE INDEX "PersonFollow_followingPersonId_idx" ON "PersonFollow"("followingPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonFollow_followerPersonId_followingPersonId_key" ON "PersonFollow"("followerPersonId", "followingPersonId");

-- CreateIndex
CREATE INDEX "Activity_actorPersonId_timestamp_idx" ON "Activity"("actorPersonId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "Activity_targetType_targetId_timestamp_idx" ON "Activity"("targetType", "targetId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "Activity_timestamp_idx" ON "Activity"("timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_personId_key" ON "Artist"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE INDEX "Artist_personId_idx" ON "Artist"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistPassport_artistId_key" ON "ArtistPassport"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistPassport_slug_key" ON "ArtistPassport"("slug");

-- CreateIndex
CREATE INDEX "ArtistPassport_isPublic_slug_idx" ON "ArtistPassport"("isPublic", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "Community_city_idx" ON "Community"("city");

-- CreateIndex
CREATE INDEX "Membership_communityId_isActive_idx" ON "Membership"("communityId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_communityId_slug_key" ON "Membership"("communityId", "slug");

-- CreateIndex
CREATE INDEX "MembershipSubscription_personId_status_idx" ON "MembershipSubscription"("personId", "status");

-- CreateIndex
CREATE INDEX "MembershipSubscription_membershipId_status_idx" ON "MembershipSubscription"("membershipId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipSubscription_membershipId_personId_key" ON "MembershipSubscription"("membershipId", "personId");

-- CreateIndex
CREATE INDEX "SupportAction_supporterPersonId_createdAt_idx" ON "SupportAction"("supporterPersonId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SupportAction_targetType_targetId_createdAt_idx" ON "SupportAction"("targetType", "targetId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SupportAction_targetType_targetId_actionType_idx" ON "SupportAction"("targetType", "targetId", "actionType");

-- CreateIndex
CREATE INDEX "Ticket_eventId_status_idx" ON "Ticket"("eventId", "status");

-- CreateIndex
CREATE INDEX "CommerceProduct_artistId_status_idx" ON "CommerceProduct"("artistId", "status");

-- CreateIndex
CREATE INDEX "CommerceProduct_communityId_status_idx" ON "CommerceProduct"("communityId", "status");

-- CreateIndex
CREATE INDEX "CommerceProduct_type_status_idx" ON "CommerceProduct"("type", "status");

-- CreateIndex
CREATE INDEX "CommerceExperience_artistId_status_idx" ON "CommerceExperience"("artistId", "status");

-- CreateIndex
CREATE INDEX "CommerceExperience_type_status_idx" ON "CommerceExperience"("type", "status");

-- CreateIndex
CREATE INDEX "FanPurchase_personId_purchasedAt_idx" ON "FanPurchase"("personId", "purchasedAt" DESC);

-- CreateIndex
CREATE INDEX "FanPurchase_productType_productId_idx" ON "FanPurchase"("productType", "productId");

-- CreateIndex
CREATE INDEX "FanPurchase_supportActionId_idx" ON "FanPurchase"("supportActionId");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_slug_key" ON "Reward"("slug");

-- CreateIndex
CREATE INDEX "Reward_isActive_category_idx" ON "Reward"("isActive", "category");

-- CreateIndex
CREATE INDEX "RewardRedemption_personId_redeemedAt_idx" ON "RewardRedemption"("personId", "redeemedAt" DESC);

-- CreateIndex
CREATE INDEX "RewardRedemption_rewardId_idx" ON "RewardRedemption"("rewardId");

-- CreateIndex
CREATE INDEX "RewardRedemption_personId_rewardId_redeemedAt_idx" ON "RewardRedemption"("personId", "rewardId", "redeemedAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityMember_communityId_status_idx" ON "CommunityMember"("communityId", "status");

-- CreateIndex
CREATE INDEX "CommunityMember_personId_status_idx" ON "CommunityMember"("personId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMember_communityId_personId_key" ON "CommunityMember"("communityId", "personId");

-- CreateIndex
CREATE INDEX "CommunityPost_communityId_publishedAt_idx" ON "CommunityPost"("communityId", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");

-- CreateIndex
CREATE INDEX "CommunityIntelligenceSnapshot_communityId_snapshotDate_idx" ON "CommunityIntelligenceSnapshot"("communityId", "snapshotDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityIntelligenceSnapshot_communityId_snapshotDate_key" ON "CommunityIntelligenceSnapshot"("communityId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_city_idx" ON "Event"("city");

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");

-- CreateIndex
CREATE INDEX "EventIntelligenceSnapshot_eventId_snapshotDate_idx" ON "EventIntelligenceSnapshot"("eventId", "snapshotDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EventIntelligenceSnapshot_eventId_snapshotDate_key" ON "EventIntelligenceSnapshot"("eventId", "snapshotDate");

-- CreateIndex
CREATE INDEX "EventParticipation_eventId_role_status_idx" ON "EventParticipation"("eventId", "role", "status");

-- CreateIndex
CREATE INDEX "EventParticipation_personId_status_idx" ON "EventParticipation"("personId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipation_eventId_personId_key" ON "EventParticipation"("eventId", "personId");

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Collaboration_status_type_createdAt_idx" ON "Collaboration"("status", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Collaboration_creatorPersonId_status_idx" ON "Collaboration"("creatorPersonId", "status");

-- CreateIndex
CREATE INDEX "Collaboration_city_idx" ON "Collaboration"("city");

-- CreateIndex
CREATE INDEX "CollaborationApplication_collaborationId_status_idx" ON "CollaborationApplication"("collaborationId", "status");

-- CreateIndex
CREATE INDEX "CollaborationApplication_applicantPersonId_status_idx" ON "CollaborationApplication"("applicantPersonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationApplication_collaborationId_applicantPersonId_key" ON "CollaborationApplication"("collaborationId", "applicantPersonId");

-- CreateIndex
CREATE INDEX "Opportunity_category_status_idx" ON "Opportunity"("category", "status");

-- CreateIndex
CREATE INDEX "Opportunity_city_idx" ON "Opportunity"("city");

-- CreateIndex
CREATE INDEX "Opportunity_deadline_idx" ON "Opportunity"("deadline");

-- CreateIndex
CREATE INDEX "Opportunity_brandId_idx" ON "Opportunity"("brandId");

-- CreateIndex
CREATE INDEX "Opportunity_agencyId_idx" ON "Opportunity"("agencyId");

-- CreateIndex
CREATE INDEX "Opportunity_listingType_city_idx" ON "Opportunity"("listingType", "city");

-- CreateIndex
CREATE INDEX "Opportunity_genre_idx" ON "Opportunity"("genre");

-- CreateIndex
CREATE INDEX "Opportunity_ownerType_ownerId_idx" ON "Opportunity"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "OpportunityApplication_opportunityId_status_idx" ON "OpportunityApplication"("opportunityId", "status");

-- CreateIndex
CREATE INDEX "OpportunityApplication_personId_status_idx" ON "OpportunityApplication"("personId", "status");

-- CreateIndex
CREATE INDEX "OpportunityActivity_opportunityId_createdAt_idx" ON "OpportunityActivity"("opportunityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Deal_artistId_status_idx" ON "Deal"("artistId", "status");

-- CreateIndex
CREATE INDEX "Deal_brandId_status_idx" ON "Deal"("brandId", "status");

-- CreateIndex
CREATE INDEX "Deal_agencyId_status_idx" ON "Deal"("agencyId", "status");

-- CreateIndex
CREATE INDEX "Deal_opportunityId_idx" ON "Deal"("opportunityId");

-- CreateIndex
CREATE INDEX "RevenueTransaction_dealId_recordedAt_idx" ON "RevenueTransaction"("dealId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "SyncMapping_tscEntityType_tscEntityId_idx" ON "SyncMapping"("tscEntityType", "tscEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncMapping_sourceSystem_externalId_tscEntityType_key" ON "SyncMapping"("sourceSystem", "externalId", "tscEntityType");

-- CreateIndex
CREATE UNIQUE INDEX "SyncEventReceipt_sourceSystem_externalId_key" ON "SyncEventReceipt"("sourceSystem", "externalId");

-- CreateIndex
CREATE INDEX "ReputationSnapshot_entityType_entityId_snapshotDate_idx" ON "ReputationSnapshot"("entityType", "entityId", "snapshotDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ReputationSnapshot_entityType_entityId_snapshotDate_key" ON "ReputationSnapshot"("entityType", "entityId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemCredit_personId_key" ON "EcosystemCredit"("personId");

-- CreateIndex
CREATE INDEX "EcosystemCreditTransaction_personId_createdAt_idx" ON "EcosystemCreditTransaction"("personId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_slug_key" ON "Agent"("slug");

-- CreateIndex
CREATE INDEX "Agent_type_isActive_idx" ON "Agent"("type", "isActive");

-- CreateIndex
CREATE INDEX "AgentTask_agentId_status_idx" ON "AgentTask"("agentId", "status");

-- CreateIndex
CREATE INDEX "AgentTask_createdAt_idx" ON "AgentTask"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AgentDecision_agentId_status_idx" ON "AgentDecision"("agentId", "status");

-- CreateIndex
CREATE INDEX "AgentDecision_entityType_entityId_idx" ON "AgentDecision"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Forecast_entityType_entityId_metric_horizon_idx" ON "Forecast"("entityType", "entityId", "metric", "horizon");

-- CreateIndex
CREATE INDEX "Forecast_createdAt_idx" ON "Forecast"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ForecastSnapshot_forecastId_snapshotDate_idx" ON "ForecastSnapshot"("forecastId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "Insight_entityType_entityId_idx" ON "Insight"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Insight_severity_createdAt_idx" ON "Insight"("severity", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Insight_category_idx" ON "Insight"("category");

-- CreateIndex
CREATE INDEX "InsightAction_insightId_status_idx" ON "InsightAction"("insightId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InsightAction_insightId_actionType_key" ON "InsightAction"("insightId", "actionType");

-- CreateIndex
CREATE INDEX "AgentRecommendation_agentId_status_idx" ON "AgentRecommendation"("agentId", "status");

-- CreateIndex
CREATE INDEX "AgentRecommendation_targetArtistId_status_idx" ON "AgentRecommendation"("targetArtistId", "status");

-- CreateIndex
CREATE INDEX "AgentRecommendation_targetPersonId_status_idx" ON "AgentRecommendation"("targetPersonId", "status");

-- CreateIndex
CREATE INDEX "AgentRecommendation_createdAt_idx" ON "AgentRecommendation"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ArtistHealthSnapshot_artistId_snapshotDate_idx" ON "ArtistHealthSnapshot"("artistId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "ArtistHealthSnapshot_healthScore_idx" ON "ArtistHealthSnapshot"("healthScore");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistHealthSnapshot_artistId_snapshotDate_key" ON "ArtistHealthSnapshot"("artistId", "snapshotDate");

-- CreateIndex
CREATE INDEX "AutomationRule_status_triggerType_idx" ON "AutomationRule"("status", "triggerType");

-- CreateIndex
CREATE INDEX "AutomationRule_workflowType_status_idx" ON "AutomationRule"("workflowType", "status");

-- CreateIndex
CREATE INDEX "AutomationRun_ruleId_createdAt_idx" ON "AutomationRun"("ruleId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AutomationRun_status_createdAt_idx" ON "AutomationRun"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Goal_entityType_entityId_idx" ON "Goal"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Goal_period_idx" ON "Goal"("period");

-- CreateIndex
CREATE INDEX "GoalProgress_goalId_recordedAt_idx" ON "GoalProgress"("goalId", "recordedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AutonomousWorkflow_slug_key" ON "AutonomousWorkflow"("slug");

-- CreateIndex
CREATE INDEX "AutonomousWorkflow_status_triggerType_idx" ON "AutonomousWorkflow"("status", "triggerType");

-- CreateIndex
CREATE INDEX "AutonomousWorkflowRun_workflowId_status_idx" ON "AutonomousWorkflowRun"("workflowId", "status");

-- CreateIndex
CREATE INDEX "AutonomousWorkflowRun_status_startedAt_idx" ON "AutonomousWorkflowRun"("status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "TscIdentity_entityType_entityId_idx" ON "TscIdentity"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "TscIdentity_namespace_slug_idx" ON "TscIdentity"("namespace", "slug");

-- CreateIndex
CREATE INDEX "TscIdentity_isPublic_idx" ON "TscIdentity"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "TscIdentity_namespace_slug_key" ON "TscIdentity"("namespace", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "TscIdentity_entityType_entityId_namespace_key" ON "TscIdentity"("entityType", "entityId", "namespace");

-- CreateIndex
CREATE INDEX "BookingRequest_artistId_status_idx" ON "BookingRequest"("artistId", "status");

-- CreateIndex
CREATE INDEX "BookingRequest_requesterPersonId_status_idx" ON "BookingRequest"("requesterPersonId", "status");

-- CreateIndex
CREATE INDEX "BookingRequest_dealId_idx" ON "BookingRequest"("dealId");

-- CreateIndex
CREATE INDEX "BookingRequest_opportunityId_idx" ON "BookingRequest"("opportunityId");

-- CreateIndex
CREATE INDEX "BookingRequest_status_createdAt_idx" ON "BookingRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ContractTemplate_slug_key" ON "ContractTemplate"("slug");

-- CreateIndex
CREATE INDEX "ContractTemplate_type_isActive_idx" ON "ContractTemplate"("type", "isActive");

-- CreateIndex
CREATE INDEX "Contract_artistId_status_idx" ON "Contract"("artistId", "status");

-- CreateIndex
CREATE INDEX "Contract_brandId_status_idx" ON "Contract"("brandId", "status");

-- CreateIndex
CREATE INDEX "Contract_dealId_idx" ON "Contract"("dealId");

-- CreateIndex
CREATE INDEX "Contract_bookingRequestId_idx" ON "Contract"("bookingRequestId");

-- CreateIndex
CREATE INDEX "Contract_templateId_idx" ON "Contract"("templateId");

-- CreateIndex
CREATE INDEX "Invoice_contractId_idx" ON "Invoice"("contractId");

-- CreateIndex
CREATE INDEX "Invoice_dealId_idx" ON "Invoice"("dealId");

-- CreateIndex
CREATE INDEX "Invoice_bookingRequestId_idx" ON "Invoice"("bookingRequestId");

-- CreateIndex
CREATE INDEX "Invoice_artistId_status_idx" ON "Invoice"("artistId", "status");

-- CreateIndex
CREATE INDEX "Escrow_dealId_idx" ON "Escrow"("dealId");

-- CreateIndex
CREATE INDEX "Escrow_contractId_idx" ON "Escrow"("contractId");

-- CreateIndex
CREATE INDEX "Escrow_status_idx" ON "Escrow"("status");

-- CreateIndex
CREATE INDEX "Payout_artistId_status_idx" ON "Payout"("artistId", "status");

-- CreateIndex
CREATE INDEX "Payout_personId_status_idx" ON "Payout"("personId", "status");

-- CreateIndex
CREATE INDEX "Payout_status_scheduledAt_idx" ON "Payout"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Settlement_periodStart_periodEnd_idx" ON "Settlement"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");

-- CreateIndex
CREATE INDEX "ApiKey_ownerOrgId_idx" ON "ApiKey"("ownerOrgId");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- CreateIndex
CREATE INDEX "WebhookSubscription_apiKeyId_isActive_idx" ON "WebhookSubscription"("apiKeyId", "isActive");

-- CreateIndex
CREATE INDEX "WebhookDelivery_subscriptionId_status_idx" ON "WebhookDelivery"("subscriptionId", "status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DataExchangePartner_slug_key" ON "DataExchangePartner"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DataExchangePartner_apiKeyId_key" ON "DataExchangePartner"("apiKeyId");

-- CreateIndex
CREATE INDEX "DataExchangePartner_isActive_idx" ON "DataExchangePartner"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelTenant_slug_key" ON "WhiteLabelTenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelTenant_apiKeyId_key" ON "WhiteLabelTenant"("apiKeyId");

-- CreateIndex
CREATE INDEX "WhiteLabelTenant_type_isActive_idx" ON "WhiteLabelTenant"("type", "isActive");

-- CreateIndex
CREATE INDEX "WhiteLabelTenant_customDomain_idx" ON "WhiteLabelTenant"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX "Workspace_ownerPersonId_idx" ON "Workspace"("ownerPersonId");

-- CreateIndex
CREATE INDEX "Workspace_type_idx" ON "Workspace"("type");

-- CreateIndex
CREATE INDEX "Workspace_creativeIdentityId_idx" ON "Workspace"("creativeIdentityId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_personId_status_idx" ON "WorkspaceMember"("personId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_personId_key" ON "WorkspaceMember"("workspaceId", "personId");

-- CreateIndex
CREATE INDEX "WorkspaceTeam_workspaceId_idx" ON "WorkspaceTeam"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceTeam_workspaceId_slug_key" ON "WorkspaceTeam"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "Project_workspaceId_idx" ON "Project"("workspaceId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_workspaceId_slug_key" ON "Project"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "ProjectMember_personId_idx" ON "ProjectMember"("personId");

-- CreateIndex
CREATE INDEX "Task_workspaceId_idx" ON "Task"("workspaceId");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_createdByPersonId_idx" ON "Task"("createdByPersonId");

-- CreateIndex
CREATE INDEX "TaskAssignee_personId_idx" ON "TaskAssignee"("personId");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- CreateIndex
CREATE INDEX "TaskChecklist_taskId_idx" ON "TaskChecklist"("taskId");

-- CreateIndex
CREATE INDEX "GeneratedOpportunity_status_createdAt_idx" ON "GeneratedOpportunity"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GeneratedOpportunity_city_genre_idx" ON "GeneratedOpportunity"("city", "genre");

-- CreateIndex
CREATE INDEX "GeneratedOpportunity_opportunityId_idx" ON "GeneratedOpportunity"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityGenerationRun_runAt_idx" ON "OpportunityGenerationRun"("runAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CreativeIdentity_personId_key" ON "CreativeIdentity"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeIdentity_slug_key" ON "CreativeIdentity"("slug");

-- CreateIndex
CREATE INDEX "CreativeIdentity_slug_idx" ON "CreativeIdentity"("slug");

-- CreateIndex
CREATE INDEX "CreativeIdentity_isPublic_idx" ON "CreativeIdentity"("isPublic");

-- CreateIndex
CREATE INDEX "CreativeIdentity_verificationLevel_idx" ON "CreativeIdentity"("verificationLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_isActive_idx" ON "Skill"("isActive");

-- CreateIndex
CREATE INDEX "CreativeIdentitySkill_skillId_idx" ON "CreativeIdentitySkill"("skillId");

-- CreateIndex
CREATE INDEX "CreativeIdentitySkill_proficiency_idx" ON "CreativeIdentitySkill"("proficiency");

-- CreateIndex
CREATE INDEX "CreativeIdentitySkill_isPrimary_idx" ON "CreativeIdentitySkill"("isPrimary");

-- CreateIndex
CREATE INDEX "SkillEndorsement_creativeIdentityId_idx" ON "SkillEndorsement"("creativeIdentityId");

-- CreateIndex
CREATE INDEX "SkillEndorsement_skillId_idx" ON "SkillEndorsement"("skillId");

-- CreateIndex
CREATE INDEX "SkillEndorsement_endorserPersonId_idx" ON "SkillEndorsement"("endorserPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillEndorsement_skillId_creativeIdentityId_endorserPersonI_key" ON "SkillEndorsement"("skillId", "creativeIdentityId", "endorserPersonId", "source");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanProfile" ADD CONSTRAINT "FanProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistFollow" ADD CONSTRAINT "ArtistFollow_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistFollow" ADD CONSTRAINT "ArtistFollow_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuperfanSnapshot" ADD CONSTRAINT "SuperfanSnapshot_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceHealthSnapshot" ADD CONSTRAINT "AudienceHealthSnapshot_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAudienceSnapshot" ADD CONSTRAINT "CommunityAudienceSnapshot_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonProfile" ADD CONSTRAINT "PersonProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonVerificationRequest" ADD CONSTRAINT "PersonVerificationRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIdentifier" ADD CONSTRAINT "PersonIdentifier_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRole" ADD CONSTRAINT "PersonRole_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityMergeLog" ADD CONSTRAINT "IdentityMergeLog_survivorPersonId_fkey" FOREIGN KEY ("survivorPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonFollow" ADD CONSTRAINT "PersonFollow_followerPersonId_fkey" FOREIGN KEY ("followerPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonFollow" ADD CONSTRAINT "PersonFollow_followingPersonId_fkey" FOREIGN KEY ("followingPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorPersonId_fkey" FOREIGN KEY ("actorPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistPassport" ADD CONSTRAINT "ArtistPassport_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAction" ADD CONSTRAINT "SupportAction_supporterPersonId_fkey" FOREIGN KEY ("supporterPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceProduct" ADD CONSTRAINT "CommerceProduct_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceProduct" ADD CONSTRAINT "CommerceProduct_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceExperience" ADD CONSTRAINT "CommerceExperience_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanPurchase" ADD CONSTRAINT "FanPurchase_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanPurchase" ADD CONSTRAINT "FanPurchase_supportActionId_fkey" FOREIGN KEY ("supportActionId") REFERENCES "SupportAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityIntelligenceSnapshot" ADD CONSTRAINT "CommunityIntelligenceSnapshot_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventIntelligenceSnapshot" ADD CONSTRAINT "EventIntelligenceSnapshot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_creatorPersonId_fkey" FOREIGN KEY ("creatorPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationApplication" ADD CONSTRAINT "CollaborationApplication_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationApplication" ADD CONSTRAINT "CollaborationApplication_applicantPersonId_fkey" FOREIGN KEY ("applicantPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityActivity" ADD CONSTRAINT "OpportunityActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "OpportunityApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueTransaction" ADD CONSTRAINT "RevenueTransaction_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemCredit" ADD CONSTRAINT "EcosystemCredit_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemCreditTransaction" ADD CONSTRAINT "EcosystemCreditTransaction_personId_fkey" FOREIGN KEY ("personId") REFERENCES "EcosystemCredit"("personId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentDecision" ADD CONSTRAINT "AgentDecision_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastSnapshot" ADD CONSTRAINT "ForecastSnapshot_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "Forecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightAction" ADD CONSTRAINT "InsightAction_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_targetPersonId_fkey" FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_targetArtistId_fkey" FOREIGN KEY ("targetArtistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistHealthSnapshot" ADD CONSTRAINT "ArtistHealthSnapshot_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgress" ADD CONSTRAINT "GoalProgress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomousWorkflowRun" ADD CONSTRAINT "AutonomousWorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutonomousWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_requesterPersonId_fkey" FOREIGN KEY ("requesterPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_ownerOrgId_fkey" FOREIGN KEY ("ownerOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataExchangePartner" ADD CONSTRAINT "DataExchangePartner_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelTenant" ADD CONSTRAINT "WhiteLabelTenant_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_creativeIdentityId_fkey" FOREIGN KEY ("creativeIdentityId") REFERENCES "CreativeIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceTeam" ADD CONSTRAINT "WorkspaceTeam_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdByPersonId_fkey" FOREIGN KEY ("createdByPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorPersonId_fkey" FOREIGN KEY ("authorPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskChecklist" ADD CONSTRAINT "TaskChecklist_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedOpportunity" ADD CONSTRAINT "GeneratedOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedOpportunity" ADD CONSTRAINT "GeneratedOpportunity_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeIdentity" ADD CONSTRAINT "CreativeIdentity_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeIdentitySkill" ADD CONSTRAINT "CreativeIdentitySkill_creativeIdentityId_fkey" FOREIGN KEY ("creativeIdentityId") REFERENCES "CreativeIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeIdentitySkill" ADD CONSTRAINT "CreativeIdentitySkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEndorsement" ADD CONSTRAINT "SkillEndorsement_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEndorsement" ADD CONSTRAINT "SkillEndorsement_creativeIdentityId_fkey" FOREIGN KEY ("creativeIdentityId") REFERENCES "CreativeIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEndorsement" ADD CONSTRAINT "SkillEndorsement_endorserPersonId_fkey" FOREIGN KEY ("endorserPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
