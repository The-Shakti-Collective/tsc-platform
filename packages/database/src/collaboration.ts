import type { Prisma } from '@prisma/client';

export const COLLABORATION_TYPES = [
  'need_rapper',
  'need_producer',
  'need_guitarist',
  'need_videographer',
  'need_cover_artist',
  'general',
] as const;

export type CollaborationTypeValue = (typeof COLLABORATION_TYPES)[number];

export const COLLABORATION_STATUSES = ['open', 'filled', 'closed', 'expired'] as const;

export type CollaborationStatusValue = (typeof COLLABORATION_STATUSES)[number];

export const COLLABORATION_APPLICATION_STATUSES = [
  'applied',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type CollaborationApplicationStatusValue =
  (typeof COLLABORATION_APPLICATION_STATUSES)[number];

export const COLLABORATED_WITH_RELATIONSHIP = 'COLLABORATED_WITH';
export const WORKED_WITH_RELATIONSHIP = 'WORKED_WITH';

export const collaborationCreatorInclude = {
  creator: {
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
  _count: {
    select: { applications: true },
  },
} satisfies Prisma.CollaborationInclude;

export const collaborationApplicationInclude = {
  applicant: {
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
} satisfies Prisma.CollaborationApplicationInclude;

export const collaborationDetailInclude = {
  ...collaborationCreatorInclude,
  applications: {
    include: collaborationApplicationInclude,
    orderBy: { appliedAt: 'desc' as const },
  },
} satisfies Prisma.CollaborationInclude;

export interface CollaborationBrowseFilters {
  type?: CollaborationTypeValue;
  genre?: string;
  city?: string;
  status?: CollaborationStatusValue;
  limit?: number;
}

export function collaborationBrowseWhere(
  filters: CollaborationBrowseFilters,
): Prisma.CollaborationWhereInput {
  const where: Prisma.CollaborationWhereInput = {
    status: filters.status ?? 'open',
  };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.city?.trim()) {
    where.city = { contains: filters.city.trim(), mode: 'insensitive' };
  }

  if (filters.genre?.trim()) {
    where.genres = { has: filters.genre.trim().toLowerCase() };
  }

  return where;
}

export function collaborationCreatorName(creator: {
  displayName: string | null;
  name: string | null;
  id: string;
}): string {
  if (creator.displayName?.trim()) return creator.displayName.trim();
  if (creator.name?.trim()) return creator.name.trim();
  return creator.id;
}
