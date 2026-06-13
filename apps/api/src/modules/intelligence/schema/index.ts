import { z } from 'zod';

export const AUTOMATION_WORKFLOW_TYPES = [
  'artist_path',
  'booking_inquiry',
  'workshop_lead',
  'signal_rule',
] as const;

export const AUTOMATION_TRIGGER_TYPES = [
  'artist_path',
  'booking_inquiry',
  'workshop_lead',
  'health_below',
  'churn_above',
  'deal_stale',
  'superfan_drop',
] as const;

export const AutomationWorkflowTypeSchema = z.enum(AUTOMATION_WORKFLOW_TYPES);
export const AutomationTriggerTypeSchema = z.enum(AUTOMATION_TRIGGER_TYPES);

export const AutomationRuleStatusSchema = z.enum(['active', 'paused', 'disabled']);

export const GoalEntityTypeSchema = z.enum([
  'Artist',
  'Organization',
  'Community',
  'Person',
  'Venue',
  'Platform',
]);

export const GoalPeriodSchema = z.enum([
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom',
]);

export const AutomationRuleCreateSchema = z.object({
  name: z.string().min(1),
  workflowType: AutomationWorkflowTypeSchema,
  triggerType: AutomationTriggerTypeSchema.optional(),
  trigger: z.record(z.unknown()).optional(),
  steps: z.array(z.record(z.unknown())).optional(),
  status: AutomationRuleStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const AutomationRuleUpdateSchema = AutomationRuleCreateSchema.partial();

export const AutomationRuleListQuerySchema = z.object({
  workflowType: AutomationWorkflowTypeSchema.optional(),
  triggerType: AutomationTriggerTypeSchema.optional(),
  status: AutomationRuleStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const AutomationTriggerSchema = z.object({
  workflowType: AutomationWorkflowTypeSchema,
  ruleId: z.string().min(1).optional(),
  payload: z.record(z.unknown()).optional(),
  personId: z.string().min(1).optional(),
  artistId: z.string().min(1).optional(),
  communityId: z.string().min(1).optional(),
  opportunityId: z.string().min(1).optional(),
});

export const AutomationRecentRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const GoalCreateSchema = z.object({
  name: z.string().min(1).optional(),
  entityType: GoalEntityTypeSchema,
  entityId: z.string().min(1),
  metric: z.string().min(1),
  target: z.number().nonnegative(),
  current: z.number().nonnegative().optional(),
  period: GoalPeriodSchema,
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const GoalUpdateSchema = GoalCreateSchema.partial();

export const GoalListQuerySchema = z.object({
  entityType: GoalEntityTypeSchema.optional(),
  entityId: z.string().min(1).optional(),
  period: GoalPeriodSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const GoalDashboardQuerySchema = z.object({
  entityType: GoalEntityTypeSchema.optional(),
  entityId: z.string().min(1).optional(),
});

export const ArtistIdQuerySchema = z.object({
  artistId: z.string().min(1).optional(),
});

export const EntityScopeQuerySchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
});

export const PersonIdQuerySchema = z.object({
  personId: z.string().min(1),
});

export const GraphEntityTypeSchema = z.enum([
  'Artist',
  'Venue',
  'Curator',
  'Brand',
  'Organization',
  'Person',
  'Festival',
  'Event',
]);

export const IntelligenceGoalProgressSchema = z.object({
  current: z.number().nonnegative(),
  metadata: z.record(z.unknown()).optional(),
});

export const CommandCenterQuerySchema = z.object({
  period: z.enum(['weekly', 'monthly']).optional().default('weekly'),
});

export const IntelligenceActionSchema = z.object({
  targetId: z.string().min(1).optional(),
  section: z.string().min(1).optional(),
  period: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});
