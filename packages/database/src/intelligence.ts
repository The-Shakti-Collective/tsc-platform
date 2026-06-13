/** Ecosystem intelligence helpers (Phase 5) — graph edge mapper lives in relationship.ts. */

export {
  toEcosystemGraphEdge,
  type EcosystemGraphEdge,
  type GraphNodeRef,
} from "./relationship.js";

export type IntelligenceDomain = "intelligence";

export const INTELLIGENCE_DOMAIN: IntelligenceDomain = "intelligence";

export const INTELLIGENCE_MODELS = [
  "OpportunityScore",
  "LeadScore",
  "SuggestedOpportunity",
  "ArtistHealthSnapshot",
  "FanIntelligenceSnapshot",
  "CityRecommendation",
  "CommunityIntelligenceSnapshot",
  "EventIntelligenceSnapshot",
  "AudienceHealthSnapshot",
  "CommunityAudienceSnapshot",
  "RecommendationRule",
  "AutomationRule",
  "AutomationRun",
  "Goal",
  "GoalProgress",
  "GraphSnapshot",
] as const;

export type IntelligenceModel = (typeof INTELLIGENCE_MODELS)[number];

export { automationRuleInclude, automationRunInclude } from "./automation.js";

export const goalWithProgressInclude = {
  progress: { orderBy: { recordedAt: 'desc' as const }, take: 1 },
} as const;
