export const COMMUNITY_ROLES = [
  'Founder',
  'Admin',
  'Moderator',
  'Contributor',
  'Member',
] as const;

export type CommunityRole = (typeof COMMUNITY_ROLES)[number];

export interface CommunityMembershipRef {
  communityId: string;
  role: CommunityRole;
}

export interface CommunityLeaderSettings {
  inviteOnly?: boolean;
  memberPosting?: boolean;
  eventCreation?: boolean;
  opportunityPosting?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CommunityContributor {
  personId: string;
  name: string;
  postCount30d: number;
  lastActiveAt: string | null;
}

export interface CommunityLinkedArtist {
  artistId: string;
  name: string;
  slug: string | null;
}

export interface CommunityEventSummary {
  id: string;
  title: string;
  startsAt: string;
  venueName: string | null;
  city: string | null;
}

export interface CommunityDashboardPayload {
  communityId: string;
  name: string;
  slug: string | null;
  memberCount: number;
  activeMemberCount: number;
  engagementScore: number;
  engagementSource: 'snapshot' | 'counts';
  topContributors: CommunityContributor[];
  linkedArtists: CommunityLinkedArtist[];
  upcomingEvents: CommunityEventSummary[];
  updatedAt: string;
}

export interface CommunityMemberItem {
  personId: string;
  name: string;
  role: CommunityRole;
  status: string;
  joinedAt: string;
  leftAt: string | null;
  lastActiveAt: string | null;
  postCount30d: number;
  isLeader: boolean;
}

export interface CommunityMembersPayload {
  communityId: string;
  items: CommunityMemberItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  updatedAt: string;
}

export interface CommunityMemberAddedPayload {
  communityId: string;
  personId: string;
  role: CommunityRole;
  relationshipId: string;
  memberId: string;
  created: boolean;
  updatedAt: string;
}

export interface CommunityEventsPayload {
  communityId: string;
  items: CommunityEventSummary[];
  updatedAt: string;
}

export interface CommunityOpportunityCreatedPayload {
  id: string;
  communityId: string;
  title: string;
  status: string;
  category: string | null;
  createdAt: string;
}

export interface CommunitySettingsPayload {
  communityId: string;
  name: string;
  slug: string | null;
  settings: CommunityLeaderSettings;
  updatedAt: string;
}
