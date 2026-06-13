import type { Prisma } from '@prisma/client';

export const COMMUNITY_MEMBER_ROLES = [
  'Founder',
  'Admin',
  'Moderator',
  'Member',
  'Contributor',
] as const;

export type CommunityMemberRoleValue = (typeof COMMUNITY_MEMBER_ROLES)[number];

export const COMMUNITY_MEMBER_STATUSES = [
  'active',
  'left',
  'banned',
  'pending',
] as const;

export type CommunityMemberStatusValue = (typeof COMMUNITY_MEMBER_STATUSES)[number];

/** Legacy Community OS role alias → Sprint 2 enum. */
export const LEGACY_COMMUNITY_MEMBER_ROLE_MAP: Record<string, CommunityMemberRoleValue> = {
  Leader: 'Founder',
  leader: 'Founder',
  admin: 'Admin',
  founder: 'Founder',
  moderator: 'Moderator',
  member: 'Member',
  contributor: 'Contributor',
};

export function normalizeCommunityMemberRole(
  role?: string | null,
): CommunityMemberRoleValue {
  if (!role) return 'Member';
  if ((COMMUNITY_MEMBER_ROLES as readonly string[]).includes(role)) {
    return role as CommunityMemberRoleValue;
  }
  return LEGACY_COMMUNITY_MEMBER_ROLE_MAP[role] ?? 'Member';
}

export const communityMemberInclude = {
  person: {
    select: {
      id: true,
      displayName: true,
      name: true,
    },
  },
} satisfies Prisma.CommunityMemberInclude;

export function activeCommunityMembersWhere(
  communityId: string,
): Prisma.CommunityMemberWhereInput {
  return {
    communityId,
    status: 'active',
  };
}
