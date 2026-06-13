/**
 * Reputation & trust calculators — stub re-exports.
 * Full scoring lives in @tsc/analytics and @tsc/database.
 */
export {
  REPUTATION_ENTITY_TYPES,
  REPUTATION_SCORE_KEYS,
  REPUTATION_WEIGHTS,
  computeWeightedOverall,
  clampScore,
  type ReputationEntityTypeValue,
  type ReputationScoreKey,
  type ReputationScores,
} from "@tsc/database";

export {
  calculateArtistTrustScore,
  calculateArtistTrustFactors,
  calculateBrandTrustScore,
  calculateBrandTrustFactors,
  calculateAgencyTrustScore,
  calculateAgencyTrustFactors,
  type ArtistTrustInput,
  type BrandTrustInput,
  type AgencyTrustInput,
} from "@tsc/analytics";
