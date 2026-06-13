import {
  AGENCY_TRUST_WEIGHTS,
  ARTIST_TRUST_WEIGHTS,
  BRAND_TRUST_WEIGHTS,
  clampTrustScore,
  computeWeightedTrustScore,
  type AgencyTrustFactors,
  type ArtistTrustFactors,
  type BrandTrustFactors,
} from '@tsc/database';

export interface ArtistTrustInput {
  eventsPerformed?: number;
  eventsWithAttendance?: number;
  applicationsResponded?: number;
  applicationsTotal?: number;
  completedDeals?: number;
  totalDeals?: number;
  communityPosts?: number;
  communityMemberships?: number;
  acceptedCollaborations?: number;
}

export interface BrandTrustInput {
  receivedAmount?: number;
  expectedAmount?: number;
  completedDeals?: number;
  totalDeals?: number;
  /** Stub — average artist review score 0–100 when reviews exist. */
  artistReviewScore?: number;
  verified?: boolean;
}

export interface AgencyTrustInput {
  rosterCount?: number;
  rosterAddedLast90?: number;
  /** Stub — share of roster with completed deals 0–100. */
  campaignSuccessRate?: number;
}

function rateScore(numerator: number, denominator: number, fallback = 0): number {
  if (denominator <= 0) return fallback;
  return clampTrustScore((numerator / denominator) * 100);
}

export function calculateArtistTrustFactors(input: ArtistTrustInput): ArtistTrustFactors {
  const performed = input.eventsPerformed ?? 0;
  const withAttendance = input.eventsWithAttendance ?? 0;
  const attendance =
    performed > 0
      ? rateScore(withAttendance, performed)
      : withAttendance > 0
        ? clampTrustScore(withAttendance * 15)
        : 0;

  const responseRate = rateScore(
    input.applicationsResponded ?? 0,
    input.applicationsTotal ?? 0,
    (input.applicationsResponded ?? 0) > 0 ? 60 : 0,
  );

  const completedDeals = clampTrustScore((input.completedDeals ?? 0) * 25);
  const communityParticipation = clampTrustScore(
    (input.communityPosts ?? 0) * 2 + (input.communityMemberships ?? 0) * 10,
  );
  const collaborations = clampTrustScore((input.acceptedCollaborations ?? 0) * 20);

  return {
    attendance,
    responseRate,
    completedDeals,
    communityParticipation,
    collaborations,
  };
}

export function calculateArtistTrustScore(input: ArtistTrustInput): number {
  const factors = calculateArtistTrustFactors(input);
  return computeWeightedTrustScore(factors, ARTIST_TRUST_WEIGHTS);
}

export function calculateBrandTrustFactors(input: BrandTrustInput): BrandTrustFactors {
  const paymentsRecorded =
    (input.expectedAmount ?? 0) > 0
      ? rateScore(input.receivedAmount ?? 0, input.expectedAmount ?? 0)
      : (input.receivedAmount ?? 0) > 0
        ? 80
        : input.verified
          ? 40
          : 0;

  const dealCompletion = rateScore(
    input.completedDeals ?? 0,
    input.totalDeals ?? 0,
    (input.completedDeals ?? 0) > 0 ? 50 : 0,
  );

  const artistReviews =
    input.artistReviewScore != null
      ? clampTrustScore(input.artistReviewScore)
      : input.verified
        ? 75
        : 35;

  return { paymentsRecorded, dealCompletion, artistReviews };
}

export function calculateBrandTrustScore(input: BrandTrustInput): number {
  const factors = calculateBrandTrustFactors(input);
  return computeWeightedTrustScore(factors, BRAND_TRUST_WEIGHTS);
}

export function calculateAgencyTrustFactors(input: AgencyTrustInput): AgencyTrustFactors {
  const rosterGrowth = clampTrustScore(
    Math.min((input.rosterCount ?? 0) * 8, 70) + Math.min((input.rosterAddedLast90 ?? 0) * 15, 30),
  );
  const campaignSuccess = clampTrustScore(input.campaignSuccessRate ?? (input.rosterCount ?? 0) > 0 ? 45 : 0);
  return { rosterGrowth, campaignSuccess };
}

export function calculateAgencyTrustScore(input: AgencyTrustInput): number {
  const factors = calculateAgencyTrustFactors(input);
  return computeWeightedTrustScore(factors, AGENCY_TRUST_WEIGHTS);
}

export type { ArtistTrustFactors, BrandTrustFactors, AgencyTrustFactors };
