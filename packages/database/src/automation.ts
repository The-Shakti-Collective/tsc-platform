/** Phase 9 Step 8 — Automation Engine V2 signal triggers + default rule catalog. */

export const AUTOMATION_WORKFLOW_TYPES = [
  'artist_path',
  'booking_inquiry',
  'workshop_lead',
  'signal_rule',
] as const;

export type AutomationWorkflowTypeValue = (typeof AUTOMATION_WORKFLOW_TYPES)[number];

export const AUTOMATION_V2_TRIGGER_TYPES = [
  'health_below',
  'churn_above',
  'deal_stale',
  'superfan_drop',
] as const;

export type AutomationV2TriggerTypeValue = (typeof AUTOMATION_V2_TRIGGER_TYPES)[number];

export const AUTOMATION_PHASE5_TRIGGER_TYPES = [
  'artist_path',
  'booking_inquiry',
  'workshop_lead',
] as const;

export type AutomationPhase5TriggerTypeValue =
  (typeof AUTOMATION_PHASE5_TRIGGER_TYPES)[number];

export const AUTOMATION_TRIGGER_TYPES = [
  ...AUTOMATION_PHASE5_TRIGGER_TYPES,
  ...AUTOMATION_V2_TRIGGER_TYPES,
] as const;

export type AutomationTriggerTypeValue = (typeof AUTOMATION_TRIGGER_TYPES)[number];

export const AUTOMATION_RULE_STATUSES = ['active', 'paused', 'disabled'] as const;

export type AutomationRuleStatusValue = (typeof AUTOMATION_RULE_STATUSES)[number];

export const AUTOMATION_RUN_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;

export type AutomationRunStatusValue = (typeof AUTOMATION_RUN_STATUSES)[number];

export const AUTOMATION_DEFAULT_THRESHOLDS = {
  healthBelow: 60,
  churnAbove: 20,
  dealStaleDays: 14,
  superfanDropPercent: 10,
} as const;

export interface AutomationRuleSeedDefinition {
  name: string;
  workflowType: AutomationWorkflowTypeValue;
  triggerType: AutomationTriggerTypeValue;
  trigger: Record<string, unknown>;
  steps: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

/** Default V2 signal rules — upserted by AutomationEngineV2Service.ensureSeedRules(). */
export const AUTOMATION_V2_RULE_CATALOG: AutomationRuleSeedDefinition[] = [
  {
    name: 'Artist health below threshold',
    workflowType: 'signal_rule',
    triggerType: 'health_below',
    trigger: {
      type: 'health_below',
      threshold: AUTOMATION_DEFAULT_THRESHOLDS.healthBelow,
    },
    steps: [
      { action: 'create_alert', severity: 'high', code: 'artist_health_low' },
      { action: 'recommend_opportunities' },
      { action: 'notify_manager', channel: 'email', requiresApproval: true },
    ],
    metadata: { catalogId: 'health_below_v1', module: 'automation_v2' },
  },
  {
    name: 'Audience churn spike',
    workflowType: 'signal_rule',
    triggerType: 'churn_above',
    trigger: {
      type: 'churn_above',
      threshold: AUTOMATION_DEFAULT_THRESHOLDS.churnAbove,
    },
    steps: [
      { action: 'create_insight', severity: 'warning', category: 'audience_churn' },
      { action: 'career_agent_run_stub' },
    ],
    metadata: { catalogId: 'churn_above_v1', module: 'automation_v2' },
  },
  {
    name: 'Deal stuck in negotiation',
    workflowType: 'signal_rule',
    triggerType: 'deal_stale',
    trigger: {
      type: 'deal_stale',
      staleDays: AUTOMATION_DEFAULT_THRESHOLDS.dealStaleDays,
      status: 'negotiation',
    },
    steps: [{ action: 'notify_stub', channel: 'email', requiresApproval: true }],
    metadata: { catalogId: 'deal_stale_v1', module: 'automation_v2' },
  },
  {
    name: 'Superfan count drop',
    workflowType: 'signal_rule',
    triggerType: 'superfan_drop',
    trigger: {
      type: 'superfan_drop',
      dropPercent: AUTOMATION_DEFAULT_THRESHOLDS.superfanDropPercent,
      tiers: ['gold', 'platinum', 'legend'],
    },
    steps: [{ action: 're_engagement_suggestion' }],
    metadata: { catalogId: 'superfan_drop_v1', module: 'automation_v2' },
  },
  {
    name: 'Insight match → opportunity generation (stub)',
    workflowType: 'signal_rule',
    triggerType: 'health_below',
    trigger: {
      type: 'health_below',
      threshold: 999,
      stubInsightMatch: true,
    },
    steps: [
      { action: 'create_insight', severity: 'info', category: 'city_heat' },
      { action: 'trigger_opportunity_generation_stub' },
    ],
    metadata: {
      catalogId: 'insight_opportunity_generation_stub_v1',
      module: 'phase14_module1',
      disabledByDefault: true,
    },
  },
];

export const automationRuleInclude = {} as const;

export const automationRunInclude = {
  rule: {
    select: {
      id: true,
      name: true,
      triggerType: true,
      workflowType: true,
    },
  },
} as const;
