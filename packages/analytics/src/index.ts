export { calculateAudienceScores, toSnapshotScores } from './audience/audience-scores.js';
export { calculateCityIntelligence } from './industry/city-intelligence.js';
export type { CityIntelligenceMetrics } from './industry/types.js';
export { summarizeEntityGraph } from './graph/entity-graph.js';
export type { EntityGraphSummary } from './graph/entity-graph.js';

export * from './intelligence/phase5/index.js';
export {
  scoreBrandMatchCandidates,
  scoreArtistOpportunities,
  type BrandMatchCandidate,
  type BrandMatchCriteria,
  type BrandMatchScoredResult,
  type ArtistOpportunityCandidate,
  type ArtistOpportunityScoredResult,
} from './intelligence/phase5/recommendationEngineV2.js';

export {
  predictAttendance,
  predictRevenueStub,
  analyzeConversion,
  analyzeAudienceGrowth,
  analyzeCommunityImpact,
  computeEventPrediction,
  computeEventAnalysis,
  type EventPredictionInput,
  type EventPredictionResult,
  type EventAnalysisInput,
  type EventAnalysisResult,
} from '@tsc/database';

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
} from './trust/trustScoring.js';
