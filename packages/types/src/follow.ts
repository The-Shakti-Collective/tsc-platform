export interface PersonFollowSummary {
  personId: string;
  displayName: string;
  slug: string | null;
  username: string | null;
  followedAt: string;
}

export interface PersonFollowListPayload {
  personId: string;
  items: PersonFollowSummary[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  updatedAt: string;
}

export interface PersonFollowPayload {
  followerPersonId: string;
  followingPersonId: string;
  relationshipId: string | null;
  created: boolean;
  updatedAt: string;
}

export interface PersonUnfollowPayload {
  followerPersonId: string;
  followingPersonId: string;
  updatedAt: string;
}

export interface FollowStatusPayload {
  personId: string;
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}
