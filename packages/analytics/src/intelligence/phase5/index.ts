export {
  calculateOpportunityScore,
  calculateLeadScoreFromOpportunity,
} from "./opportunityScoring.js";
export { detectCityEventGap, detectSuggestedOpportunities } from "./suggestedOpportunities.js";
export { calculateArtistHealth } from "./artistHealth.js";
export { calculateFanIntelligence, classifyFanTier } from "./fanIntelligence.js";
export { calculateEcosystemCityIntelligence } from "./cityIntelligence.js";
export { calculateCommunityIntelligence } from "./communityIntelligence.js";
export { generateRecommendations } from "./recommendationEngine.js";
export {
  scoreBrandMatchCandidates,
  scoreArtistOpportunities,
} from "./recommendationEngineV2.js";
export {
  runIntelligenceSnapshotJob,
  type IntelligenceSnapshotArtistTarget,
  type IntelligenceSnapshotCommunityTarget,
  type IntelligenceSnapshotFanTarget,
  type IntelligenceSnapshotJobResult,
  type RunIntelligenceSnapshotJobOptions,
} from "./runIntelligenceSnapshotJob.js";
export type {
  ArtistHealthDimensionScores,
  ArtistHealthInput,
  ArtistHealthResult,
  ArtistHealthRiskAlert,
  CityEventGapInput,
  CityIntelligenceRecommendationDraft,
  CommunityIntelligenceInput,
  CommunityIntelligenceResult,
  EcosystemCityIntelligenceInput,
  EcosystemCityIntelligenceResult,
  FanIntelligenceInput,
  FanIntelligenceScores,
  OpportunityScoringFactors,
  OpportunityScoringInput,
  OpportunityScoringResult,
  RecommendationCandidateInput,
  RecommendationEngineInput,
  ScoredRecommendation,
  SuggestedOpportunityDraft,
  PHASE5_SCORE_VERSION,
} from "./types.js";
