import type { Prisma } from '@prisma/client';

export const ACTIVITY_ACTIONS = [
  'joined_community',
  'left_community',
  'registered_event',
  'checked_in_event',
  'posted_collaboration',
  'applied_collaboration',
  'applied_opportunity',
  'won_opportunity',
  'launched_opportunity',
  'followed_person',
  'unfollowed_person',
  'followed_artist',
  'supported_artist',
  'supported_community',
  'supported_event',
  'subscribed_membership',
  'redeemed_reward',
  'updated_profile',
  'created_brand',
  'created_agency',
  'created_label',
  'reviewed_application',
  'hired_artist',
  'tracked_listing',
  'deal_created',
  'deal_completed',
  'deal_paid',
  'invoice_paid',
  'payment_collected',
  'escrow_held',
  'escrow_released',
  'payout_scheduled',
  'purchased_product',
  'agent_recommendation_created',
  'career_actions_generated',
  'career_action_dismissed',
  'community_agent_suggestions_generated',
  'community_suggestion_approved',
  'community_suggestion_dismissed',
  'event_agent_insights_generated',
  'event_suggestion_approved',
  'event_suggestion_dismissed',
  'brand_match_run_completed',
  'brand_match_invite_sent',
  'talent_discovery_scan_completed',
  'talent_discovery_alert_acknowledged',
  'forecast_generated',
  'insight_action_executed',
  'automation_rule_evaluated',
  'automation_action_stubbed',
  'copilot_query_answered',
  'autonomous_workflow_started',
  'autonomous_workflow_step_completed',
  'autonomous_workflow_approved',
  'autonomous_workflow_completed',
  'autonomous_workflow_cancelled',
  'workspace_created',
  'workspace_member_added',
  'project_created',
  'task_created',
  'task_completed',
  'creative_identity_created',
  'creative_role_added',
  'skill_added',
  'skill_endorsed',
  'opportunity_generated',
  'opportunity_generation_published',
] as const;

export type ActivityActionValue = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_VISIBILITIES = ['public', 'followers', 'private'] as const;

export type ActivityVisibilityValue = (typeof ACTIVITY_VISIBILITIES)[number];

/** Sprint 2 stub event type → persisted ActivityAction. */
export const ACTIVITY_STUB_TYPE_MAP: Record<string, ActivityActionValue> = {
  'community.member.joined': 'joined_community',
  'community.member.added': 'joined_community',
  'community.member.left': 'left_community',
  'event.participant.registered': 'registered_event',
  'event.participant.checked_in': 'checked_in_event',
  'brand.created': 'created_brand',
  'agency.created': 'created_agency',
  'label.created': 'created_label',
};

export const activityInclude = {
  actor: {
    select: {
      id: true,
      displayName: true,
      name: true,
      profile: {
        select: {
          slug: true,
          username: true,
        },
      },
    },
  },
} satisfies Prisma.ActivityInclude;

export function activityActorName(actor: {
  displayName: string | null;
  name: string | null;
  id: string;
}): string {
  if (actor.displayName?.trim()) return actor.displayName.trim();
  if (actor.name?.trim()) return actor.name.trim();
  return actor.id;
}
