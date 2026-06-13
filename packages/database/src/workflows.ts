/** Phase 9 Step 10 — Autonomous Workflows (Module 10). */

export const AUTONOMOUS_WORKFLOW_TRIGGER_TYPES = [
  'manual',
  'campaign_created',
  'insight_action',
  'schedule',
] as const;

export type AutonomousWorkflowTriggerTypeValue =
  (typeof AUTONOMOUS_WORKFLOW_TRIGGER_TYPES)[number];

export const AUTONOMOUS_WORKFLOW_STATUSES = ['active', 'draft', 'archived'] as const;

export type AutonomousWorkflowStatusValue = (typeof AUTONOMOUS_WORKFLOW_STATUSES)[number];

export const AUTONOMOUS_WORKFLOW_RUN_STATUSES = [
  'pending',
  'running',
  'awaiting_approval',
  'completed',
  'failed',
  'cancelled',
] as const;

export type AutonomousWorkflowRunStatusValue =
  (typeof AUTONOMOUS_WORKFLOW_RUN_STATUSES)[number];

export const WORKFLOW_AGENT_SLUG = 'workflow-agent';

export const BRAND_CAMPAIGN_OUTREACH_SLUG = 'brand_campaign_outreach';

export type AutonomousWorkflowStepDefinition = {
  id: string;
  name: string;
  type: 'gate' | 'agent' | 'transform' | 'stub' | 'report';
  action?: string;
  agentSlug?: string;
  gate?: 'start' | 'end';
  requiresApproval?: boolean;
};

export type AutonomousWorkflowStepLogEntry = {
  stepId: string;
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval';
  startedAt: string;
  completedAt: string | null;
  output: Record<string, unknown>;
  error?: string;
};

export const BRAND_CAMPAIGN_OUTREACH_STEPS: AutonomousWorkflowStepDefinition[] = [
  {
    id: 'start_gate',
    name: 'Review campaign brief',
    type: 'gate',
    gate: 'start',
    requiresApproval: true,
  },
  {
    id: 'find_artists',
    name: 'Find matching artists',
    type: 'agent',
    agentSlug: 'brand-match-agent',
    action: 'brand_match_run',
  },
  {
    id: 'rank_artists',
    name: 'Rank artist matches',
    type: 'transform',
    action: 'rank_artists',
  },
  {
    id: 'send_invitations',
    name: 'Send campaign invitations',
    type: 'stub',
    action: 'send_invitations',
    requiresApproval: true,
  },
  {
    id: 'track_responses',
    name: 'Track application responses',
    type: 'agent',
    action: 'track_responses',
  },
  {
    id: 'generate_report',
    name: 'Generate outreach report',
    type: 'report',
    gate: 'end',
    requiresApproval: true,
  },
];

export const AUTONOMOUS_WORKFLOW_CATALOG = [
  {
    slug: BRAND_CAMPAIGN_OUTREACH_SLUG,
    name: 'Brand Campaign Outreach',
    triggerType: 'manual' as const,
    steps: BRAND_CAMPAIGN_OUTREACH_STEPS,
    description:
      'Brand creates campaign → find artists → rank → invite (stub) → track responses → report. Human approves at start, before invites, and at end.',
  },
] as const;

export const AUTONOMOUS_WORKFLOW_MODELS = [
  'AutonomousWorkflow',
  'AutonomousWorkflowRun',
] as const;

export type AutonomousWorkflowModel = (typeof AUTONOMOUS_WORKFLOW_MODELS)[number];
