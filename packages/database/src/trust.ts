import type { Prisma } from '@prisma/client';

export const TRUST_ENTITY_TYPES = ['Artist', 'Brand', 'Agency'] as const;
export type TrustEntityTypeValue = (typeof TRUST_ENTITY_TYPES)[number];

export const ARTIST_TRUST_FACTOR_KEYS = [
  'attendance',
  'responseRate',
  'completedDeals',
  'communityParticipation',
  'collaborations',
] as const;

export const BRAND_TRUST_FACTOR_KEYS = [
  'paymentsRecorded',
  'dealCompletion',
  'artistReviews',
] as const;

export const AGENCY_TRUST_FACTOR_KEYS = ['rosterGrowth', 'campaignSuccess'] as const;

export type ArtistTrustFactors = Record<(typeof ARTIST_TRUST_FACTOR_KEYS)[number], number>;
export type BrandTrustFactors = Record<(typeof BRAND_TRUST_FACTOR_KEYS)[number], number>;
export type AgencyTrustFactors = Record<(typeof AGENCY_TRUST_FACTOR_KEYS)[number], number>;

export type TrustFactors = ArtistTrustFactors | BrandTrustFactors | AgencyTrustFactors;

export const ARTIST_TRUST_WEIGHTS: Record<keyof ArtistTrustFactors, number> = {
  attendance: 0.25,
  responseRate: 0.2,
  completedDeals: 0.25,
  communityParticipation: 0.15,
  collaborations: 0.15,
};

export const BRAND_TRUST_WEIGHTS: Record<keyof BrandTrustFactors, number> = {
  paymentsRecorded: 0.4,
  dealCompletion: 0.35,
  artistReviews: 0.25,
};

export const AGENCY_TRUST_WEIGHTS: Record<keyof AgencyTrustFactors, number> = {
  rosterGrowth: 0.55,
  campaignSuccess: 0.45,
};

export function clampTrustScore(value: number, max = 100): number {
  return Math.min(max, Math.max(0, Math.round(value * 100) / 100));
}

export function computeWeightedTrustScore(
  factors: Record<string, number>,
  weights: Record<string, number>,
): number {
  let total = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (factors[key] ?? 0) * weight;
    weightSum += weight;
  }
  if (weightSum <= 0) return 0;
  return clampTrustScore(total / weightSum);
}

export function trustSnapshotWhere(
  entityType: TrustEntityTypeValue,
  entityId: string,
): Prisma.TrustSnapshotWhereInput {
  return { entityType, entityId };
}

export const VERIFIED_BRAND_TRUST_THRESHOLD = 70;
export const VERIFIED_ARTIST_LEVEL = 4;

export function resolveTrustBadges(input: {
  entityType: TrustEntityTypeValue;
  trustScore: number;
  brandVerified?: boolean;
  artistVerificationLevel?: number;
}): string[] {
  const badges: string[] = [];
  if (input.entityType === 'Brand' && (input.brandVerified || input.trustScore >= VERIFIED_BRAND_TRUST_THRESHOLD)) {
    badges.push('verified_brand_partner');
  }
  if (input.entityType === 'Artist' && (input.artistVerificationLevel ?? 0) >= VERIFIED_ARTIST_LEVEL) {
    badges.push('verified_artist');
  }
  if (input.trustScore >= 85) badges.push('high_trust');
  else if (input.trustScore >= 60) badges.push('trusted');
  return badges;
}
