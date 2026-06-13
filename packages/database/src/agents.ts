/** Phase 9 Step 1 — Autonomous Ecosystem Decision Layer. */

export const AGENT_TYPES = [
  'opportunity',
  'career',
  'community',
  'event',
  'brand_match',
  'talent_discovery',
  'forecast',
  'copilot',
  'workflow',
] as const;

export type AgentTypeValue = (typeof AGENT_TYPES)[number];

export const AGENT_TASK_STATUSES = ['pending', 'running', 'completed', 'failed'] as const;

export type AgentTaskStatusValue = (typeof AGENT_TASK_STATUSES)[number];

export const AGENT_DECISION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'executed',
] as const;

export type AgentDecisionStatusValue = (typeof AGENT_DECISION_STATUSES)[number];

export const AGENT_RECOMMENDATION_STATUSES = [
  'pending',
  'active',
  'dismissed',
  'applied',
  'expired',
] as const;

export type AgentRecommendationStatusValue =
  (typeof AGENT_RECOMMENDATION_STATUSES)[number];

export const AGENT_MODELS = [
  'Agent',
  'AgentTask',
  'AgentDecision',
  'AgentRecommendation',
] as const;

export type AgentModel = (typeof AGENT_MODELS)[number];

export const OPPORTUNITY_AGENT_SLUG = 'opportunity-agent';

export const CAREER_AGENT_SLUG = 'career-agent';

export const CAREER_SUGGESTED_ACTION_TYPES = [
  'play_city',
  'collaborate',
  'apply_opportunity',
  'grow_community',
  'improve_health',
] as const;

export type CareerSuggestedActionTypeValue =
  (typeof CAREER_SUGGESTED_ACTION_TYPES)[number];

export const COMMUNITY_AGENT_SLUG = 'community-agent';

export const COMMUNITY_SUGGESTION_TYPES = [
  'suggest_event',
  'create_poll',
  'recommend_member',
  're_engage_member',
] as const;

export type CommunitySuggestionTypeValue =
  (typeof COMMUNITY_SUGGESTION_TYPES)[number];

export const EVENT_AGENT_SLUG = 'event-agent';

export const EVENT_SUGGESTION_TYPES = [
  'optimize_marketing',
  'adjust_capacity',
  'partner_venue',
  'repeat_in_city',
  'book_venue_again',
  'expand_community',
] as const;

export type EventSuggestionTypeValue = (typeof EVENT_SUGGESTION_TYPES)[number];

export const BRAND_MATCH_AGENT_SLUG = 'brand-match-agent';

export const TALENT_DISCOVERY_AGENT_SLUG = 'talent-discovery-agent';

export {
  FORECAST_AGENT_SLUG,
} from './forecast.js';

export {
  COPILOT_AGENT_SLUG,
} from './copilot.js';

export {
  WORKFLOW_AGENT_SLUG,
} from './workflows.js';

export {
  TALENT_DISCOVERY_ALERT_ENTITY_TYPES,
  type TalentDiscoveryAlertEntityType,
} from './talent-discovery.js';

export const AUTOMATION_AGENT_SLUG = 'automation-agent';

export const agentRecommendationInclude = {
  agent: {
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
    },
  },
} as const;
