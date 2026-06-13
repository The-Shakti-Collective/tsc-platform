import { z } from 'zod';

export const AgentTypeSchema = z.enum([
  'opportunity',
  'career',
  'community',
  'event',
  'brand_match',
  'talent_discovery',
  'forecast',
  'copilot',
  'workflow',
]);

export const AgentDecisionStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'executed',
]);

export const AgentRecommendationStatusSchema = z.enum([
  'pending',
  'active',
  'dismissed',
  'applied',
  'expired',
]);

export const RecordAgentRecommendationInputSchema = z.object({
  agentId: z.string().min(1),
  targetPersonId: z.string().min(1).optional(),
  targetArtistId: z.string().min(1).optional(),
  title: z.string().min(1),
  rationale: z.string().min(1),
  score: z.coerce.number().min(0).max(100),
  confidence: z.coerce.number().min(0).max(1),
  status: AgentRecommendationStatusSchema.optional().default('active'),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const RecordAgentDecisionInputSchema = z.object({
  agentId: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  decisionType: z.string().min(1),
  payload: z.record(z.unknown()).optional().default({}),
  confidence: z.coerce.number().min(0).max(1),
  status: AgentDecisionStatusSchema.optional().default('pending'),
});

export const OpportunityAgentRunInputSchema = z.object({
  artistId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(10),
});

export const CareerSuggestedActionTypeSchema = z.enum([
  'play_city',
  'collaborate',
  'apply_opportunity',
  'grow_community',
  'improve_health',
]);

export const CareerAgentRunInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});

export const CommunitySuggestionTypeSchema = z.enum([
  'suggest_event',
  'create_poll',
  'recommend_member',
  're_engage_member',
]);

export const CommunityAgentRunInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});

export const EventSuggestionTypeSchema = z.enum([
  'optimize_marketing',
  'adjust_capacity',
  'partner_venue',
  'repeat_in_city',
  'book_venue_again',
  'expand_community',
]);

export const EventAgentRunInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(6),
});

export const BrandMatchAgentRunInputSchema = z.object({
  brandId: z.string().min(1),
  genre: z.string().min(1).optional(),
  audienceAge: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  budget: z.coerce.number().nonnegative().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional().default(20),
});

export const AgentRecommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  status: AgentRecommendationStatusSchema.optional(),
});

export const TalentDiscoveryAlertEntityTypeSchema = z.enum(['Artist', 'Community', 'City']);

export const TalentDiscoveryAgentRunInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  cityLimit: z.coerce.number().int().min(1).max(30).optional().default(10),
});

export const TalentDiscoveryAlertsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  status: AgentRecommendationStatusSchema.optional(),
  entityType: TalentDiscoveryAlertEntityTypeSchema.optional(),
});

export const ForecastMetricSchema = z.enum([
  'revenue',
  'attendance',
  'growth',
  'demand',
  'membership_churn',
]);

export const ForecastHorizonSchema = z.enum(['d30', 'd90']);

export const ForecastAgentRunInputSchema = z.object({
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  metrics: z.array(ForecastMetricSchema).optional(),
  horizons: z.array(ForecastHorizonSchema).optional().default(['d30', 'd90']),
});

export const InsightsFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  category: z.string().min(1).optional(),
});

export const CopilotIntentSchema = z.enum([
  'artists_at_risk',
  'communities_growing',
  'opportunities_for_me',
  'collaboration_matches',
  'revenue_forecast',
  'fallback',
]);

export const CopilotQueryInputSchema = z.object({
  message: z.string().min(1).max(2000),
  personId: z.string().min(1).optional(),
  artistId: z.string().min(1).optional(),
  context: z.record(z.unknown()).optional().default({}),
});

export const CopilotFeedbackInputSchema = z.object({
  taskId: z.string().min(1).optional(),
  message: z.string().min(1).max(2000).optional(),
  intent: CopilotIntentSchema.optional(),
  rating: z.enum(['up', 'down']),
  comment: z.string().max(500).optional(),
});

export const AutonomousWorkflowRunInputSchema = z.object({
  workflowSlug: z.string().min(1),
  payload: z.record(z.unknown()).optional().default({}),
  approveStart: z.boolean().optional().default(false),
});

export const AutonomousWorkflowApproveInputSchema = z.object({
  note: z.string().max(500).optional(),
});

export const CommandCenterV5ActionInputSchema = z.object({
  section: z.string().min(1).optional(),
  period: z.enum(['weekly', 'monthly']).optional(),
  targetId: z.string().min(1).optional(),
  artistId: z.string().min(1).optional(),
  communityId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  opportunityIds: z.array(z.string().min(1)).optional(),
  workflowSlug: z.string().min(1).optional(),
});

export type RecordAgentRecommendationInput = z.infer<
  typeof RecordAgentRecommendationInputSchema
>;
export type RecordAgentDecisionInput = z.infer<typeof RecordAgentDecisionInputSchema>;
export type OpportunityAgentRunInput = z.infer<typeof OpportunityAgentRunInputSchema>;
export type CareerAgentRunInput = z.infer<typeof CareerAgentRunInputSchema>;
export type CommunityAgentRunInput = z.infer<typeof CommunityAgentRunInputSchema>;
export type EventAgentRunInput = z.infer<typeof EventAgentRunInputSchema>;
export type BrandMatchAgentRunInput = z.infer<typeof BrandMatchAgentRunInputSchema>;
export type AgentRecommendationsQuery = z.infer<typeof AgentRecommendationsQuerySchema>;
export type TalentDiscoveryAgentRunInput = z.infer<typeof TalentDiscoveryAgentRunInputSchema>;
export type TalentDiscoveryAlertsQuery = z.infer<typeof TalentDiscoveryAlertsQuerySchema>;
export type ForecastAgentRunInput = z.infer<typeof ForecastAgentRunInputSchema>;
export type InsightsFeedQuery = z.infer<typeof InsightsFeedQuerySchema>;
export type CopilotQueryInput = z.infer<typeof CopilotQueryInputSchema>;
export type CopilotFeedbackInput = z.infer<typeof CopilotFeedbackInputSchema>;
export type AutonomousWorkflowRunInput = z.infer<typeof AutonomousWorkflowRunInputSchema>;
export type AutonomousWorkflowApproveInput = z.infer<typeof AutonomousWorkflowApproveInputSchema>;
export type CommandCenterV5ActionInput = z.infer<typeof CommandCenterV5ActionInputSchema>;
