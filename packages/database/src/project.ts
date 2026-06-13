import type { Prisma } from '@prisma/client';

export const PROJECT_TYPES = [
  'album',
  'tour',
  'festival',
  'community_campaign',
  'brand_campaign',
  'music_video',
  'general',
] as const;

export type ProjectTypeValue = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = [
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived',
] as const;

export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export const PROJECT_MEMBER_ROLES = ['owner', 'lead', 'member', 'viewer'] as const;

export type ProjectMemberRoleValue = (typeof PROJECT_MEMBER_ROLES)[number];

export const PROJECT_MODELS = ['Project', 'ProjectMember'] as const;

export const PROJECT_TYPE_LABELS: Record<ProjectTypeValue, string> = {
  album: 'Album',
  tour: 'Tour',
  festival: 'Festival',
  community_campaign: 'Community Campaign',
  brand_campaign: 'Brand Campaign',
  music_video: 'Music Video',
  general: 'General',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatusValue, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
};

export const PROJECT_MEMBER_ROLE_LABELS: Record<ProjectMemberRoleValue, string> = {
  owner: 'Owner',
  lead: 'Lead',
  member: 'Member',
  viewer: 'Viewer',
};

export function projectWorkspaceSlugWhere(
  workspaceId: string,
  slug: string,
): Prisma.ProjectWhereInput {
  return { workspaceId, slug };
}

export function projectsByWorkspaceWhere(workspaceId: string): Prisma.ProjectWhereInput {
  return { workspaceId };
}

export const projectMemberInclude = {
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
} satisfies Prisma.ProjectMemberInclude;

export const projectInclude = {
  members: {
    include: projectMemberInclude,
    orderBy: [{ role: 'asc' as const }, { joinedAt: 'asc' as const }],
  },
  tasks: {
    select: {
      id: true,
      status: true,
    },
  },
} satisfies Prisma.ProjectInclude;

export function slugifyProject(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function canManageProject(role: ProjectMemberRoleValue): boolean {
  return role === 'owner' || role === 'lead';
}
