import type {
  AudienceIntelligenceInput,
  CityRecommendationType,
  FanIntelligenceTier,
  RecommendationEntityType,
  ScoreTier,
} from "@tsc/types";
import type { CityIntelligenceInput, CityIntelligenceMetrics } from "../../industry/types.js";

/** Signals for opportunity / lead scoring (Phase 5). */
export interface OpportunityScoringInput {
  opportunityId: string;
  /** Expected deal value in base currency. */
  revenuePotential?: number;
  /** Benchmark for normalization (segment median). */
  revenueBenchmark?: number;
  /** 0–100 artist–opportunity fit. */
  artistMatch?: number;
  /** 0–100 geo / market fit. */
  locationFit?: number;
  /** 0–100 engagement with opportunity activities. */
  engagement?: number;
  /** 0–100 brand alignment. */
  brandFit?: number;
  /** Days until target close date (lower = hotter). */
  daysToClose?: number;
}

export interface OpportunityScoringFactors {
  revenuePotential: number;
  artistMatch: number;
  location: number;
  engagement: number;
  brandFit: number;
  timeline: number;
}

export interface OpportunityScoringResult {
  opportunityId: string;
  score: number;
  tier: ScoreTier;
  confidence: number;
  factors: OpportunityScoringFactors;
  calculatedAt: string;
  version: number;
}

/** City fan density vs event cadence — gap detection input. */
export interface CityEventGapInput {
  artistId: string;
  city: string;
  fanCount: number;
  monthsSinceLastEvent?: number;
  /** Default 6 — flag when no event in this many months. */
  gapThresholdMonths?: number;
  avgEventAttendance?: number;
}

export interface SuggestedOpportunityDraft {
  artistId: string;
  type: string;
  title: string;
  rationale: string;
  potentialAttendance?: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/** Artist health signals — listeners, community, shows. */
export interface ArtistHealthInput {
  artistId: string;
  listenerCount?: number;
  /** Percent change over 30 days (negative = decline). */
  listenerChange30d?: number;
  communityPostsLast30?: number;
  communityActiveMembers?: number;
  communityMemberTotal?: number;
  showsLast90?: number;
  showsBookedNext90?: number;
  followerCount?: number;
  followerChange30d?: number;
}

export interface ArtistHealthDimensionScores {
  listeners: number;
  communityActivity: number;
  shows: number;
}

export interface ArtistHealthRiskAlert {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
}

export interface ArtistHealthResult {
  artistId: string;
  healthScore: number;
  dimensions: ArtistHealthDimensionScores;
  riskAlerts: ArtistHealthRiskAlert[];
  calculatedAt: string;
  version: number;
}

/** Fan intelligence — extends audience signals with influence. */
export interface FanIntelligenceInput extends AudienceIntelligenceInput {
  personId: string;
  artistId?: string;
  /** Referrals, shares, moderator activity (0–100 scale or raw count). */
  influenceSignal?: number;
  influenceCap?: number;
}

export interface FanIntelligenceScores {
  engagementScore: number;
  purchaseScore: number;
  attendanceScore: number;
  influenceScore: number;
  loyaltyScore: number;
  tier: FanIntelligenceTier;
  compositeScore: number;
}

/** Phase 5 city rollup + recommendation inputs. */
export interface EcosystemCityIntelligenceInput extends CityIntelligenceInput {
  monthsSinceLastEvent?: number;
  workshopInterestCount?: number;
  chapterMemberCount?: number;
  hasLocalChapter?: boolean;
  artistBookingDemand?: number;
}

export interface CityIntelligenceRecommendationDraft {
  city: string;
  recommendationType: CityRecommendationType;
  rationale: string;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface EcosystemCityIntelligenceResult {
  metrics: CityIntelligenceMetrics;
  recommendations: CityIntelligenceRecommendationDraft[];
}

/** Community growth / retention / churn signals. */
export interface CommunityIntelligenceInput {
  communityId: string;
  memberCount?: number;
  memberCountPrevious30?: number;
  activeMembersLast30?: number;
  activeMembersPrevious30?: number;
  churnedMembersLast30?: number;
  newMembersLast30?: number;
  postsLast30?: number;
  dormantMemberCount?: number;
  superFanCount?: number;
}

export interface CommunityIntelligenceResult {
  communityId: string;
  growth: number;
  retention: number;
  churn: number;
  superFanCount: number;
  dormantCount: number;
  reEngagementSignals: string[];
  metrics: Record<string, unknown>;
  calculatedAt: string;
  version: number;
}

/** Rule-based recommendation candidate input. */
export interface RecommendationCandidateInput {
  entityType: RecommendationEntityType;
  entityId: string;
  artistGenres?: string[];
  eventGenres?: string[];
  city?: string;
  /** artist | event | workshop — used for reason codes. */
  kind?: "artist" | "event" | "workshop";
  /** Base popularity signal 0–100. */
  popularity?: number;
}

export interface RecommendationEngineInput {
  personId: string;
  city?: string;
  preferredGenres?: string[];
  followedArtistIds?: string[];
  attendedEventIds?: string[];
  candidates: RecommendationCandidateInput[];
  maxResults?: number;
}

export interface ScoredRecommendation {
  personId: string;
  entityType: RecommendationEntityType;
  entityId: string;
  score: number;
  reasonCodes: string[];
}

export const PHASE5_SCORE_VERSION = 1;
