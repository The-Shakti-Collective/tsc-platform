-- CoreKnot domain backend Phases 1–3

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER', 'ARTIST', 'TEAM_MEMBER', 'CLIENT', 'FAN');
CREATE TYPE "LeadPipelineStage" AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');
CREATE TYPE "InquiryStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE "GigStatus" AS ENUM ('tentative', 'confirmed', 'completed', 'cancelled');
CREATE TYPE "ExpenseStatus" AS ENUM ('draft', 'approved', 'paid', 'void');
CREATE TYPE "ReleaseStatus" AS ENUM ('draft', 'scheduled', 'released', 'archived');
CREATE TYPE "RoyaltyStatus" AS ENUM ('pending', 'accrued', 'paid');
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('draft', 'active', 'paused', 'closed');
CREATE TYPE "DomainNotificationType" AS ENUM ('system', 'inquiry', 'gig', 'invoice', 'message');
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete', 'status_change');

-- AlterTable Organization
ALTER TABLE "Organization" ADD COLUMN "slug" TEXT;
UPDATE "Organization" SET "slug" = "id" WHERE "slug" IS NULL;
ALTER TABLE "Organization" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Organization" ADD COLUMN "type" TEXT;
ALTER TABLE "Organization" ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Organization" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Organization" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'TEAM_MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable Identity
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable OrganizationMember
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable OrganizationTeam
CREATE TABLE "OrganizationTeam" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "leadPersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable OrganizationTeamMember
CREATE TABLE "OrganizationTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable Lead
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "stage" "LeadPipelineStage" NOT NULL DEFAULT 'new',
    "assignedPersonId" TEXT,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable Inquiry
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'open',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "artistId" TEXT,
    "assignedPersonId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable Gig
CREATE TABLE "Gig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "artistId" TEXT,
    "title" TEXT NOT NULL,
    "venue" TEXT,
    "city" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "GigStatus" NOT NULL DEFAULT 'tentative',
    "fee" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
);

-- CreateTable Expense
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "ExpenseStatus" NOT NULL DEFAULT 'draft',
    "category" TEXT,
    "incurredAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable Release
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "artistId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "releaseDate" TIMESTAMP(3),
    "status" "ReleaseStatus" NOT NULL DEFAULT 'draft',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable Royalty
CREATE TABLE "Royalty" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" "RoyaltyStatus" NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Royalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable MarketplaceListing
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "listingType" "MarketplaceListingType",
    "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'draft',
    "price" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "opportunityId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable Message
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "threadId" TEXT NOT NULL,
    "senderPersonId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "recipientPersonId" TEXT NOT NULL,
    "type" "DomainNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "actorPersonId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
CREATE UNIQUE INDEX "User_personId_key" ON "User"("personId");
CREATE INDEX "User_platformRole_idx" ON "User"("platformRole");
CREATE UNIQUE INDEX "Identity_personId_key" ON "Identity"("personId");
CREATE UNIQUE INDEX "OrganizationMember_organizationId_personId_key" ON "OrganizationMember"("organizationId", "personId");
CREATE INDEX "OrganizationMember_personId_status_idx" ON "OrganizationMember"("personId", "status");
CREATE INDEX "OrganizationMember_organizationId_role_idx" ON "OrganizationMember"("organizationId", "role");
CREATE UNIQUE INDEX "OrganizationTeam_organizationId_slug_key" ON "OrganizationTeam"("organizationId", "slug");
CREATE INDEX "OrganizationTeam_organizationId_idx" ON "OrganizationTeam"("organizationId");
CREATE INDEX "OrganizationTeam_leadPersonId_idx" ON "OrganizationTeam"("leadPersonId");
CREATE UNIQUE INDEX "OrganizationTeamMember_teamId_personId_key" ON "OrganizationTeamMember"("teamId", "personId");
CREATE INDEX "OrganizationTeamMember_personId_idx" ON "OrganizationTeamMember"("personId");
CREATE INDEX "Lead_organizationId_stage_idx" ON "Lead"("organizationId", "stage");
CREATE INDEX "Lead_assignedPersonId_idx" ON "Lead"("assignedPersonId");
CREATE INDEX "Inquiry_organizationId_status_idx" ON "Inquiry"("organizationId", "status");
CREATE INDEX "Inquiry_artistId_idx" ON "Inquiry"("artistId");
CREATE INDEX "Inquiry_assignedPersonId_idx" ON "Inquiry"("assignedPersonId");
CREATE INDEX "Gig_organizationId_startsAt_idx" ON "Gig"("organizationId", "startsAt");
CREATE INDEX "Gig_artistId_startsAt_idx" ON "Gig"("artistId", "startsAt");
CREATE INDEX "Gig_status_idx" ON "Gig"("status");
CREATE INDEX "Expense_organizationId_status_idx" ON "Expense"("organizationId", "status");
CREATE INDEX "Expense_incurredAt_idx" ON "Expense"("incurredAt");
CREATE INDEX "Release_organizationId_status_idx" ON "Release"("organizationId", "status");
CREATE INDEX "Release_artistId_idx" ON "Release"("artistId");
CREATE INDEX "Release_releaseDate_idx" ON "Release"("releaseDate");
CREATE INDEX "Royalty_releaseId_status_idx" ON "Royalty"("releaseId", "status");
CREATE UNIQUE INDEX "MarketplaceListing_opportunityId_key" ON "MarketplaceListing"("opportunityId");
CREATE INDEX "MarketplaceListing_organizationId_status_idx" ON "MarketplaceListing"("organizationId", "status");
CREATE INDEX "MarketplaceListing_listingType_status_idx" ON "MarketplaceListing"("listingType", "status");
CREATE INDEX "Message_threadId_sentAt_idx" ON "Message"("threadId", "sentAt" DESC);
CREATE INDEX "Message_organizationId_idx" ON "Message"("organizationId");
CREATE INDEX "Message_senderPersonId_idx" ON "Message"("senderPersonId");
CREATE INDEX "Notification_recipientPersonId_readAt_idx" ON "Notification"("recipientPersonId", "readAt");
CREATE INDEX "Notification_organizationId_createdAt_idx" ON "Notification"("organizationId", "createdAt" DESC);
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt" DESC);
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorPersonId_idx" ON "AuditLog"("actorPersonId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Identity" ADD CONSTRAINT "Identity_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationTeam" ADD CONSTRAINT "OrganizationTeam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationTeam" ADD CONSTRAINT "OrganizationTeam_leadPersonId_fkey" FOREIGN KEY ("leadPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizationTeamMember" ADD CONSTRAINT "OrganizationTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "OrganizationTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationTeamMember" ADD CONSTRAINT "OrganizationTeamMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedPersonId_fkey" FOREIGN KEY ("assignedPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_assignedPersonId_fkey" FOREIGN KEY ("assignedPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Gig" ADD CONSTRAINT "Gig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Gig" ADD CONSTRAINT "Gig_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Release" ADD CONSTRAINT "Release_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Release" ADD CONSTRAINT "Release_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Royalty" ADD CONSTRAINT "Royalty_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderPersonId_fkey" FOREIGN KEY ("senderPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientPersonId_fkey" FOREIGN KEY ("recipientPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorPersonId_fkey" FOREIGN KEY ("actorPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
