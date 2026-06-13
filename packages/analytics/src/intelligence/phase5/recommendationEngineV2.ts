import { clampScore } from '../utils.js';
import { calculateOpportunityScore } from './opportunityScoring.js';
import { calculateCityIntelligence } from '../../industry/city-intelligence.js';

const TRUST_WEIGHT = 0.15;
const GENRE_WEIGHT = 0.2;
const CITY_WEIGHT = 0.15;
const BUDGET_WEIGHT = 0.2;
const ENGAGEMENT_WEIGHT = 0.15;
const CITY_HEAT_WEIGHT = 0.15;

function genreOverlap(preferred: string | undefined, candidateGenres: string[] = []): number {
  if (!preferred || candidateGenres.length === 0) return 0;
  const needle = preferred.toLowerCase();
  const matches = candidateGenres.filter((g) => g.toLowerCase().includes(needle) || needle.includes(g.toLowerCase())).length;
  return clampScore((matches / Math.max(candidateGenres.length, 1)) * 100);
}

function cityMatch(criteriaCity: string | undefined, artistCity: string | null | undefined): number {
  if (!criteriaCity || !artistCity) return 40;
  return criteriaCity.toLowerCase() === artistCity.toLowerCase() ? 100 : 20;
}

function budgetFit(budget: number | undefined, followerCount: number): number {
  if (!budget || budget <= 0) return 50;
  const impliedTier = followerCount >= 50_000 ? 'macro' : followerCount >= 10_000 ? 'mid' : 'emerging';
  const tierBudget =
    impliedTier === 'macro' ? 500_000 : impliedTier === 'mid' ? 150_000 : 50_000;
  const ratio = budget / tierBudget;
  if (ratio >= 0.8 && ratio <= 1.5) return 100;
  if (ratio >= 0.5 && ratio <= 2) return 75;
  return clampScore(50 - Math.abs(1 - ratio) * 30);
}

export interface BrandMatchCandidate {
  artistId: string;
  artistName: string | null;
  slug: string | null;
  city: string | null;
  genres: string[];
  followerCount?: number;
  trustScore?: number | null;
  engagementScore?: number;
  cityMetrics?: {
    artistsCount?: number;
    fansCount?: number;
    venuesCount?: number;
    eventsCount?: number;
    communityMembers?: number;
  };
}

export interface BrandMatchCriteria {
  brandId: string;
  genre?: string;
  city?: string;
  budget?: number;
  audienceAge?: string;
}

export interface BrandMatchScoredResult {
  artistId: string;
  artistName: string | null;
  slug: string | null;
  city: string | null;
  genres: string[];
  score: number;
  confidence: number;
  trustScore: number | null;
  reasonCodes: string[];
  factors: {
    artistMatch: number;
    location: number;
    engagement: number;
    brandFit: number;
    revenuePotential: number;
    trustWeight: number;
  };
}

/**
 * Recommendation V2 — brand campaign → ranked artists.
 * Wraps Phase 5 opportunity scoring + trust weight (read-only).
 */
export function scoreBrandMatchCandidates(
  criteria: BrandMatchCriteria,
  candidates: BrandMatchCandidate[],
): BrandMatchScoredResult[] {
  const cityHeat =
    criteria.city && candidates[0]?.cityMetrics
      ? calculateCityIntelligence({
          city: criteria.city,
          ...candidates[0].cityMetrics,
        }).heatScore
      : 50;

  return candidates
    .map((candidate) => {
      const reasonCodes: string[] = [];
      const artistMatch = genreOverlap(criteria.genre, candidate.genres);
      const location = cityMatch(criteria.city, candidate.city);
      const engagement = clampScore(candidate.engagementScore ?? Math.min((candidate.followerCount ?? 0) / 500, 100));
      const brandFit = clampScore(artistMatch * 0.6 + engagement * 0.4);
      const revenuePotential = budgetFit(criteria.budget, candidate.followerCount ?? 0);
      const trustWeight = clampScore(candidate.trustScore ?? 50);

      if (artistMatch >= 60) reasonCodes.push('genre_match');
      if (location >= 80) reasonCodes.push('location_match');
      if (engagement >= 60) reasonCodes.push('high_engagement');
      if (trustWeight >= 70) reasonCodes.push('high_trust');
      if (revenuePotential >= 75) reasonCodes.push('budget_fit');

      const composite = clampScore(
        artistMatch * GENRE_WEIGHT +
          location * CITY_WEIGHT +
          engagement * ENGAGEMENT_WEIGHT +
          brandFit * 0.1 +
          revenuePotential * BUDGET_WEIGHT +
          cityHeat * CITY_HEAT_WEIGHT +
          trustWeight * TRUST_WEIGHT,
      );

      const opportunityScore = calculateOpportunityScore({
        opportunityId: `brand-match:${criteria.brandId}:${candidate.artistId}`,
        revenuePotential: criteria.budget,
        artistMatch,
        locationFit: location,
        engagement,
        brandFit,
        daysToClose: 30,
      });

      const score = clampScore(composite * 0.65 + opportunityScore.score * 0.35);
      if (reasonCodes.length === 0) reasonCodes.push('explore');

      return {
        artistId: candidate.artistId,
        artistName: candidate.artistName,
        slug: candidate.slug,
        city: candidate.city,
        genres: candidate.genres,
        score,
        confidence: opportunityScore.confidence,
        trustScore: candidate.trustScore ?? null,
        reasonCodes,
        factors: {
          artistMatch,
          location,
          engagement,
          brandFit,
          revenuePotential,
          trustWeight,
        },
      };
    })
    .sort((a, b) => b.score - a.score);
}

export interface ArtistOpportunityCandidate {
  opportunityId: string;
  title: string;
  listingType: string | null;
  city: string | null;
  genre: string | null;
  budget: number | null;
  brandId: string | null;
  brandTrustScore: number | null;
  artistGenres: string[];
  artistCity: string | null;
  engagement?: number;
}

export interface ArtistOpportunityScoredResult {
  opportunityId: string;
  title: string;
  listingType: string | null;
  city: string | null;
  genre: string | null;
  budget: number | null;
  score: number;
  confidence: number;
  brandTrustScore: number | null;
  reasonCodes: string[];
}

/**
 * Recommendation V2 — artist "Recommended For You" opportunities.
 */
export function scoreArtistOpportunities(
  candidates: ArtistOpportunityCandidate[],
  limit = 20,
): ArtistOpportunityScoredResult[] {
  return candidates
    .map((candidate) => {
      const reasonCodes: string[] = [];
      const artistMatch = genreOverlap(
        candidate.artistGenres[0],
        candidate.genre ? [candidate.genre] : [],
      );
      const location = cityMatch(candidate.artistCity ?? undefined, candidate.city ?? undefined);
      const engagement = clampScore(candidate.engagement ?? 50);
      const trustBoost = clampScore(candidate.brandTrustScore ?? 50);

      if (artistMatch >= 50) reasonCodes.push('genre_match');
      if (location >= 80) reasonCodes.push('location_match');
      if ((candidate.budget ?? 0) >= 100_000) reasonCodes.push('high_value');
      if (trustBoost >= 70) reasonCodes.push('trusted_brand');

      const scored = calculateOpportunityScore({
        opportunityId: candidate.opportunityId,
        revenuePotential: candidate.budget ?? undefined,
        artistMatch,
        locationFit: location,
        engagement,
        brandFit: trustBoost,
        daysToClose: 45,
      });

      const score = clampScore(scored.score * 0.85 + trustBoost * TRUST_WEIGHT);
      if (reasonCodes.length === 0) reasonCodes.push('explore');

      return {
        opportunityId: candidate.opportunityId,
        title: candidate.title,
        listingType: candidate.listingType,
        city: candidate.city,
        genre: candidate.genre,
        budget: candidate.budget,
        score,
        confidence: scored.confidence,
        brandTrustScore: candidate.brandTrustScore,
        reasonCodes,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
