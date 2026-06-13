export interface DiscoveryPersonItem {
  personId: string;
  displayName: string;
  slug: string | null;
  city: string | null;
  genres: string[];
  sharedCommunities: number;
  matchScore: number;
  reason: string;
}

export interface DiscoveryCommunityItem {
  communityId: string;
  name: string;
  city: string | null;
  genres: string[];
  memberCount: number;
  friendsInCommunity: number;
  matchScore: number;
  reason: string;
}

export interface DiscoveryEventItem {
  eventId: string;
  title: string;
  city: string | null;
  startsAt: string | null;
  matchScore: number;
  reason: string;
}

export interface DiscoveryCollaborationItem {
  collaborationId: string;
  title: string;
  type: string;
  city: string | null;
  genres: string[];
  matchScore: number;
  reason: string;
}

export interface DiscoveryListPayload<T> {
  items: T[];
  updatedAt: string;
}
