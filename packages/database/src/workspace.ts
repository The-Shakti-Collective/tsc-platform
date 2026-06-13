import type { Prisma } from '@prisma/client';

export const WORKSPACE_TYPES = [
  'artist',
  'manager',
  'team',
  'community_leader',
  'agency',
  'personal',
] as const;

export type WorkspaceTypeValue = (typeof WORKSPACE_TYPES)[number];

export const WORKSPACE_MEMBER_ROLES = [
  'owner',
  'admin',
  'member',
  'guest',
] as const;

export type WorkspaceMemberRoleValue = (typeof WORKSPACE_MEMBER_ROLES)[number];

export const WORKSPACE_MEMBER_STATUSES = [
  'active',
  'invited',
  'removed',
] as const;

export type WorkspaceMemberStatusValue = (typeof WORKSPACE_MEMBER_STATUSES)[number];

export const WORKSPACE_MODELS = ['Workspace', 'WorkspaceMember', 'WorkspaceTeam'] as const;

export const WORKSPACE_TYPE_LABELS: Record<WorkspaceTypeValue, string> = {
  artist: 'Artist Workspace',
  manager: 'Manager Workspace',
  team: 'Team Workspace',
  community_leader: 'Community Leader',
  agency: 'Agency Workspace',
  personal: 'Personal Workspace',
};

export const WORKSPACE_MEMBER_ROLE_LABELS: Record<WorkspaceMemberRoleValue, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  guest: 'Guest',
};

export const WORKSPACE_ROUTE_PREFIX = '/workspace';

export function workspaceSlugWhere(slug: string): Prisma.WorkspaceWhereInput {
  return { slug };
}

export function workspaceOwnerWhere(personId: string): Prisma.WorkspaceWhereInput {
  return { ownerPersonId: personId };
}

export function workspaceMemberWhere(
  workspaceId: string,
  personId: string,
): Prisma.WorkspaceMemberWhereInput {
  return { workspaceId, personId, status: 'active' };
}

export function activeWorkspaceMembersWhere(
  workspaceId: string,
): Prisma.WorkspaceMemberWhereInput {
  return { workspaceId, status: 'active' };
}

export function personalWorkspaceWhere(personId: string): Prisma.WorkspaceWhereInput {
  return { ownerPersonId: personId, type: 'personal' };
}

export const workspaceInclude = {
  owner: {
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
  members: {
    where: { status: 'active' },
    include: {
      person: {
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
    },
  },
  teams: {
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.WorkspaceInclude;

export const workspaceMemberInclude = {
  person: {
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
} satisfies Prisma.WorkspaceMemberInclude;

export function slugifyWorkspace(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function defaultPersonalWorkspaceName(displayName?: string | null): string {
  const trimmed = displayName?.trim();
  if (trimmed) return `${trimmed}'s Workspace`;
  return 'My Workspace';
}

export function canManageWorkspaceMembers(role: WorkspaceMemberRoleValue): boolean {
  return role === 'owner' || role === 'admin';
}

export function parseWorkspaceSettings(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export interface WorkspaceIdentityLink {
  tscIdentitySlug: string | null;
  tscIdentityNamespace: 'fan' | 'artist' | null;
}

export function extractWorkspaceIdentityLink(settings: unknown): WorkspaceIdentityLink {
  const parsed = parseWorkspaceSettings(settings);
  const slug =
    typeof parsed.tscIdentitySlug === 'string' && parsed.tscIdentitySlug.trim()
      ? parsed.tscIdentitySlug.trim()
      : null;
  const namespace =
    parsed.tscIdentityNamespace === 'fan' || parsed.tscIdentityNamespace === 'artist'
      ? parsed.tscIdentityNamespace
      : null;
  return { tscIdentitySlug: slug, tscIdentityNamespace: namespace };
}
