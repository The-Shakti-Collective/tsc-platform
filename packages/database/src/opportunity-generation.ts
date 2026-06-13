/** Phase 14 Module 1 — rule-based opportunity generation from intelligence signals. */

export const GENERATED_OPPORTUNITY_SOURCES = ['system', 'brand', 'community'] as const;
export type GeneratedOpportunitySourceValue = (typeof GENERATED_OPPORTUNITY_SOURCES)[number];

export const GENERATED_OPPORTUNITY_STATUSES = [
  'draft',
  'pending_approval',
  'published',
  'dismissed',
] as const;
export type GeneratedOpportunityStatusValue =
  (typeof GENERATED_OPPORTUNITY_STATUSES)[number];

export const GENERATED_OPPORTUNITY_TYPES = [
  'showcase_event',
  'collaboration_open_call',
  'grant_opportunity',
] as const;
export type GeneratedOpportunityTypeValue = (typeof GENERATED_OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_GENERATION_MODELS = [
  'GeneratedOpportunity',
  'OpportunityGenerationRun',
] as const;

export type OpportunityGenerationModel = (typeof OPPORTUNITY_GENERATION_MODELS)[number];

/** City+genre audience growth floor for showcase event rule. */
export const SHOWCASE_AUDIENCE_GROWTH_THRESHOLD = 30;

/** Community activity growth floor paired with city growth. */
export const SHOWCASE_COMMUNITY_ACTIVITY_THRESHOLD = 25;

/** Community member growth floor for collaboration open call. */
export const COLLABORATION_MEMBER_GROWTH_THRESHOLD = 20;

/** Minimum artists in city+genre cluster for collaboration rule. */
export const COLLABORATION_ARTIST_CLUSTER_MIN = 3;

/** Brand fund stub + emerging artist grant rule. */
export const GRANT_EMERGING_ARTIST_GROWTH_THRESHOLD = 35;

export const OPPORTUNITY_GENERATION_RULE_IDS = {
  cityGenreShowcase: 'city_genre_showcase_event',
  communityCollaboration: 'community_spike_collaboration',
  brandGrantEmerging: 'brand_fund_emerging_artist_grant',
} as const;

export type OpportunityGenerationRuleId =
  (typeof OPPORTUNITY_GENERATION_RULE_IDS)[keyof typeof OPPORTUNITY_GENERATION_RULE_IDS];

export interface OpportunityGenerationSignalSnapshot {
  ruleId: OpportunityGenerationRuleId;
  city?: string | null;
  genre?: string | null;
  audienceGrowth?: number;
  communityActivity?: number;
  memberGrowth?: number;
  artistClusterCount?: number;
  brandId?: string | null;
  brandName?: string | null;
  communityId?: string | null;
  communityName?: string | null;
  eventDensityGrowth?: number;
  reasonCodes: string[];
}

export function buildShowcaseEventTitle(city: string, genre: string): string {
  const label = formatGenreLabel(genre);
  return `Launch ${label} Showcase Event — ${city}`;
}

export function buildCollaborationTitle(communityName: string, city?: string | null): string {
  const place = city ? ` in ${city}` : '';
  return `Collaboration Open Call — ${communityName}${place}`;
}

export function buildGrantTitle(brandName: string, genre?: string | null): string {
  const genrePart = genre ? ` ${formatGenreLabel(genre)}` : '';
  return `${brandName}${genrePart} Emerging Artist Grant`;
}

function formatGenreLabel(genre: string): string {
  return genre
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('-');
}

export function scoreShowcaseConfidence(
  audienceGrowth: number,
  communityActivity: number,
): number {
  const raw = 0.45 + audienceGrowth / 200 + communityActivity / 250;
  return Math.round(Math.min(0.95, Math.max(0.5, raw)) * 100) / 100;
}

export function scoreCollaborationConfidence(
  memberGrowth: number,
  artistClusterCount: number,
): number {
  const raw = 0.4 + memberGrowth / 150 + artistClusterCount * 0.05;
  return Math.round(Math.min(0.92, Math.max(0.48, raw)) * 100) / 100;
}

export function scoreGrantConfidence(
  artistGrowth: number,
  hasBrandFund: boolean,
): number {
  const raw = (hasBrandFund ? 0.55 : 0.4) + artistGrowth / 180;
  return Math.round(Math.min(0.9, Math.max(0.45, raw)) * 100) / 100;
}

export const generatedOpportunityInclude = {
  opportunity: {
    select: {
      id: true,
      title: true,
      status: true,
      marketplaceVisible: true,
      city: true,
      category: true,
      listingType: true,
    },
  },
  approvedByPerson: {
    select: {
      id: true,
      displayName: true,
      name: true,
    },
  },
} as const;
