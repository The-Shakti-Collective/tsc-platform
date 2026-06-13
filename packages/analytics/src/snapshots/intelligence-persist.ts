import type { Prisma, PrismaClient } from "@tsc/database/client";
import type { SuggestedOpportunityStatus } from "@tsc/types";
import { toSnapshotDateOnly } from "./persist.js";
import type {
  ArtistHealthResult,
  CityIntelligenceRecommendationDraft,
  CommunityIntelligenceResult,
  FanIntelligenceScores,
  OpportunityScoringResult,
  SuggestedOpportunityDraft,
} from "../intelligence/phase5/types.js";

export interface PersistOpportunityScoreOptions {
  prisma: PrismaClient;
  result: OpportunityScoringResult;
  id?: string;
}

export interface PersistLeadScoreOptions {
  prisma: PrismaClient;
  personId: string;
  result: OpportunityScoringResult;
  opportunityId?: string;
  id?: string;
}

export interface PersistSuggestedOpportunityOptions {
  prisma: PrismaClient;
  draft: SuggestedOpportunityDraft;
  status?: SuggestedOpportunityStatus;
  id?: string;
}

export interface PersistArtistHealthSnapshotOptions {
  prisma: PrismaClient;
  result: ArtistHealthResult;
  snapshotDate: Date;
  id?: string;
}

export interface PersistFanIntelligenceSnapshotOptions {
  prisma: PrismaClient;
  personId: string;
  artistId: string | null;
  scores: FanIntelligenceScores;
  snapshotDate: Date;
  metadata?: Record<string, unknown>;
  id?: string;
}

export interface PersistCommunityIntelligenceSnapshotOptions {
  prisma: PrismaClient;
  result: CommunityIntelligenceResult;
  snapshotDate: Date;
  id?: string;
}

export interface PersistCityRecommendationOptions {
  prisma: PrismaClient;
  draft: CityIntelligenceRecommendationDraft;
  id?: string;
}

/** Insert latest opportunity score row (stub — model deferred to Stage 2). */
export async function createOpportunityScore(options: PersistOpportunityScoreOptions) {
  const { result, id } = options;
  void options.prisma;
  return {
    id: id ?? crypto.randomUUID(),
    opportunityId: result.opportunityId,
    tier: result.tier,
    confidence: result.confidence,
    factors: {
      score: result.score,
      ...result.factors,
      calculatedAt: result.calculatedAt,
      version: result.version,
    },
  };
}

/** Insert lead score for a person (stub — model deferred to Stage 2). */
export async function createLeadScore(options: PersistLeadScoreOptions) {
  const { personId, result, opportunityId, id } = options;
  void options.prisma;
  return {
    id: id ?? crypto.randomUUID(),
    personId,
    opportunityId: opportunityId ?? null,
    tier: result.tier,
    confidence: result.confidence,
    factors: {
      score: result.score,
      ...result.factors,
      calculatedAt: result.calculatedAt,
      version: result.version,
    },
  };
}

/** Upsert suggested opportunity (stub — model deferred to Stage 2). */
export async function upsertSuggestedOpportunity(options: PersistSuggestedOpportunityOptions) {
  const { draft, status = "suggested", id } = options;
  void options.prisma;
  return {
    id: id ?? crypto.randomUUID(),
    artistId: draft.artistId,
    type: draft.type,
    title: draft.title,
    rationale: draft.rationale,
    potentialAttendance: draft.potentialAttendance ?? null,
    confidence: draft.confidence,
    status,
    metadata: draft.metadata ?? {},
  };
}

/** Upsert daily artist health snapshot. */
export async function createArtistHealthSnapshot(options: PersistArtistHealthSnapshotOptions) {
  const { prisma, result, id } = options;
  const snapshotDate = toSnapshotDateOnly(options.snapshotDate);
  const rowId = id ?? crypto.randomUUID();

  return prisma.artistHealthSnapshot.upsert({
    where: {
      artistId_snapshotDate: { artistId: result.artistId, snapshotDate },
    },
    create: {
      id: rowId,
      artistId: result.artistId,
      healthScore: result.healthScore,
      dimensions: result.dimensions as unknown as Prisma.InputJsonValue,
      riskAlerts: result.riskAlerts as unknown as Prisma.InputJsonValue,
      snapshotDate,
    },
    update: {
      healthScore: result.healthScore,
      dimensions: result.dimensions as unknown as Prisma.InputJsonValue,
      riskAlerts: result.riskAlerts as unknown as Prisma.InputJsonValue,
    },
  });
}

/** Upsert daily fan intelligence snapshot. */
export async function createFanIntelligenceSnapshot(
  options: PersistFanIntelligenceSnapshotOptions,
) {
  const { prisma, personId, artistId, scores, metadata, id } = options;
  const snapshotDate = toSnapshotDateOnly(options.snapshotDate);
  const rowId = id ?? crypto.randomUUID();
  const payload = {
    engagementScore: scores.engagementScore,
    purchaseScore: scores.purchaseScore,
    attendanceScore: scores.attendanceScore,
    influenceScore: scores.influenceScore,
    loyaltyScore: scores.loyaltyScore,
    tier: scores.tier,
    metadata: (metadata ?? {}) as unknown as Prisma.InputJsonValue,
  };

  const existing = await prisma.fanIntelligenceSnapshot.findFirst({
    where: { personId, artistId: artistId ?? null, snapshotDate },
  });

  if (existing) {
    return prisma.fanIntelligenceSnapshot.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.fanIntelligenceSnapshot.create({
    data: {
      id: rowId,
      personId,
      artistId,
      snapshotDate,
      ...payload,
    },
  });
}

/** Upsert daily community intelligence snapshot. */
export async function createCommunityIntelligenceSnapshot(
  options: PersistCommunityIntelligenceSnapshotOptions,
) {
  const { prisma, result, id } = options;
  const snapshotDate = toSnapshotDateOnly(options.snapshotDate);
  const rowId = id ?? crypto.randomUUID();

  return prisma.communityIntelligenceSnapshot.upsert({
    where: {
      communityId_snapshotDate: { communityId: result.communityId, snapshotDate },
    },
    create: {
      id: rowId,
      communityId: result.communityId,
      growth: result.growth,
      retention: result.retention,
      churn: result.churn,
      superFanCount: result.superFanCount,
      dormantCount: result.dormantCount,
      metrics: {
        ...result.metrics,
        reEngagementSignals: result.reEngagementSignals,
        calculatedAt: result.calculatedAt,
        version: result.version,
      } as unknown as Prisma.InputJsonValue,
      snapshotDate,
    },
    update: {
      growth: result.growth,
      retention: result.retention,
      churn: result.churn,
      superFanCount: result.superFanCount,
      dormantCount: result.dormantCount,
      metrics: {
        ...result.metrics,
        reEngagementSignals: result.reEngagementSignals,
        calculatedAt: result.calculatedAt,
        version: result.version,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

/** Insert city recommendation row (stub — model deferred to Stage 2). */
export async function createCityRecommendation(options: PersistCityRecommendationOptions) {
  const { draft, id } = options;
  void options.prisma;
  return {
    id: id ?? crypto.randomUUID(),
    city: draft.city,
    recommendationType: draft.recommendationType,
    rationale: draft.rationale,
    priority: draft.priority,
    metadata: draft.metadata ?? {},
  };
}
