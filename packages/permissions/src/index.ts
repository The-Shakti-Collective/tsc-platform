import type { CommunityRole } from '@tsc/types';

export interface MembershipContext {
  userId: string;
  /** Resolved TSC person id when linked to Clerk/coreknot user. */
  personId?: string;
  roles: string[];
  artistMemberships: string[];
  organizationMemberships: string[];
  communityMemberships?: Array<{
    communityId: string;
    role: CommunityRole;
  }>;
}

export type { CommunityRole } from '@tsc/types';
export { COMMUNITY_ROLES } from '@tsc/types';

export type CommunityPermission =
  | 'community:read'
  | 'community:post'
  | 'community:moderate'
  | 'community:manage_members'
  | 'community:manage_settings'
  | 'community:delete'
  | 'community:invite'
  | 'community:pin_post';

const ROLE_PERMISSIONS: Record<CommunityRole, readonly CommunityPermission[]> = {
  Founder: [
    'community:read',
    'community:post',
    'community:moderate',
    'community:manage_members',
    'community:manage_settings',
    'community:delete',
    'community:invite',
    'community:pin_post',
  ],
  Admin: [
    'community:read',
    'community:post',
    'community:moderate',
    'community:manage_members',
    'community:manage_settings',
    'community:invite',
    'community:pin_post',
  ],
  Moderator: [
    'community:read',
    'community:post',
    'community:moderate',
    'community:invite',
    'community:pin_post',
  ],
  Contributor: ['community:read', 'community:post', 'community:invite'],
  Member: ['community:read', 'community:post'],
};

export function permissionsForCommunityRole(
  role: CommunityRole,
): readonly CommunityPermission[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.Member;
}

export function hasCommunityPermission(
  ctx: MembershipContext,
  communityId: string,
  permission: CommunityPermission,
): boolean {
  if (ctx.roles.includes('admin')) return true;

  const membership = ctx.communityMemberships?.find(
    (row) => row.communityId === communityId,
  );
  if (!membership) return false;

  return permissionsForCommunityRole(membership.role).includes(permission);
}

export function canManageArtist(
  ctx: MembershipContext,
  artistId: string,
): boolean {
  return ctx.roles.includes('admin') || ctx.artistMemberships.includes(artistId);
}

export function isAdmin(ctx: MembershipContext): boolean {
  return ctx.roles.includes('admin');
}

export function isCommunityModeratorOrAbove(
  ctx: MembershipContext,
  communityId: string,
): boolean {
  if (isAdmin(ctx)) return true;
  const membership = ctx.communityMemberships?.find(
    (row) => row.communityId === communityId,
  );
  if (!membership) return false;
  return ['Founder', 'Admin', 'Moderator'].includes(membership.role);
}
