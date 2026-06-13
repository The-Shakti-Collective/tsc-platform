export type ActivityAction =
  | 'joined_community'
  | 'left_community'
  | 'registered_event'
  | 'checked_in_event'
  | 'posted_collaboration'
  | 'applied_collaboration'
  | 'applied_opportunity'
  | 'won_opportunity'
  | 'launched_opportunity'
  | 'followed_person'
  | 'unfollowed_person'
  | 'followed_artist'
  | 'supported_artist'
  | 'supported_community'
  | 'supported_event'
  | 'subscribed_membership'
  | 'redeemed_reward'
  | 'updated_profile'
  | 'created_brand'
  | 'created_agency'
  | 'created_label'
  | 'reviewed_application'
  | 'hired_artist'
  | 'tracked_listing'
  | 'purchased_product'
  | 'agent_recommendation_created'
  | 'career_actions_generated'
  | 'career_action_dismissed'
  | 'community_agent_suggestions_generated'
  | 'community_suggestion_approved'
  | 'community_suggestion_dismissed'
  | 'workspace_created'
  | 'workspace_member_added'
  | 'project_created'
  | 'task_created'
  | 'task_completed'
  | 'opportunity_generated'
  | 'opportunity_generation_published';

export type ActivityVisibility = 'public' | 'followers' | 'private';

export interface ActivityFeedItem {
  id: string;
  action: ActivityAction;
  actorPersonId: string;
  actorName: string;
  actorSlug: string | null;
  targetType: string;
  targetId: string;
  targetTitle: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  message: string;
  visibility: ActivityVisibility;
}

export interface ActivityFeedPayload {
  items: ActivityFeedItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  sources?: {
    following: number;
    communities: number;
    trending: number;
  };
  updatedAt: string;
}

export interface ActivityRecordPayload {
  id: string;
  actorPersonId: string;
  action: ActivityAction;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  visibility: ActivityVisibility;
}
