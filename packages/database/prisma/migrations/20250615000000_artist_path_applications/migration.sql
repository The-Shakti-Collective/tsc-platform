-- CreateEnum
CREATE TYPE "ArtistPathApplicationStatus" AS ENUM ('submitted', 'under_review', 'shortlisted', 'selected', 'rejected');

-- CreateTable
CREATE TABLE "ArtistPathApplication" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "ArtistPathApplicationStatus" NOT NULL DEFAULT 'submitted',
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "stageName" TEXT,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT 'theartistpath.in',
    "externalRowId" TEXT,
    "personId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistPathApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistPathApplication_externalRowId_key" ON "ArtistPathApplication"("externalRowId");

-- CreateIndex
CREATE INDEX "ArtistPathApplication_organizationId_submittedAt_idx" ON "ArtistPathApplication"("organizationId", "submittedAt");

-- CreateIndex
CREATE INDEX "ArtistPathApplication_organizationId_status_idx" ON "ArtistPathApplication"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ArtistPathApplication_email_idx" ON "ArtistPathApplication"("email");

-- CreateIndex
CREATE INDEX "ArtistPathApplication_phone_idx" ON "ArtistPathApplication"("phone");

-- CreateIndex
CREATE INDEX "ArtistPathApplication_personId_idx" ON "ArtistPathApplication"("personId");

-- AddForeignKey
ALTER TABLE "ArtistPathApplication" ADD CONSTRAINT "ArtistPathApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistPathApplication" ADD CONSTRAINT "ArtistPathApplication_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
