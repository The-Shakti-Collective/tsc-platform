import type { CommunityRole } from './community.js';

export type CommunityMemberRole = CommunityRole;

export type CommunityMemberStatus = 'active' | 'left' | 'banned' | 'pending';

export interface CommunityMemberRecord {
  personId: string;
  name: string;
  role: CommunityMemberRole;
  status: CommunityMemberStatus;
  joinedAt: string;
  leftAt: string | null;
  lastActiveAt: string | null;
  postCount30d?: number;
  isLeader: boolean;
}

export interface CommunityJoinPayload {
  communityId: string;
  personId: string;
  role: CommunityMemberRole;
  status: CommunityMemberStatus;
  relationshipId: string;
  memberId: string;
  created: boolean;
  updatedAt: string;
}

export interface CommunityLeavePayload {
  communityId: string;
  personId: string;
  status: CommunityMemberStatus;
  leftAt: string;
  relationshipId: string | null;
  updatedAt: string;
}

export interface CommunityMemberRolePayload {
  communityId: string;
  personId: string;
  role: CommunityMemberRole;
  updatedAt: string;
}
