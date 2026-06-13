import type { Prisma } from '@prisma/client';

export const OPPORTUNITY_CATEGORIES = [
  'scholarship',
  'residency',
  'brand_deal',
  'festival_slot',
  'workshop',
  'collaboration',
  'open_call',
  'funding',
] as const;

export type OpportunityCategoryValue = (typeof OPPORTUNITY_CATEGORIES)[number];

export const OPPORTUNITY_APPLICATION_STATUSES = [
  'saved',
  'applied',
  'shortlisted',
  'won',
  'rejected',
] as const;

export type OpportunityApplicationStatusValue =
  (typeof OPPORTUNITY_APPLICATION_STATUSES)[number];

export const MARKETPLACE_OPPORTUNITY_STATUSES = ['open', 'pending'] as const;

export const opportunityApplicationInclude = {
  opportunity: {
    select: {
      id: true,
      title: true,
      category: true,
      city: true,
      deadline: true,
      status: true,
      value: true,
      source: true,
      organizationId: true,
      brandId: true,
    },
  },
  person: {
    select: { id: true, displayName: true, email: true },
  },
  artist: {
    select: { id: true, name: true, slug: true },
  },
} satisfies Prisma.OpportunityApplicationInclude;

export const marketplaceOpportunityInclude = {
  organization: {
    select: { id: true, name: true },
  },
  _count: {
    select: { applications: true, activities: true },
  },
} satisfies Prisma.OpportunityInclude;

export function marketplaceBrowseWhere(input: {
  category?: OpportunityCategoryValue;
  city?: string;
  deadlineBefore?: Date;
  deadlineAfter?: Date;
}): Prisma.OpportunityWhereInput {
  const where: Prisma.OpportunityWhereInput = {
    marketplaceVisible: true,
    status: { in: [...MARKETPLACE_OPPORTUNITY_STATUSES] },
  };

  if (input.category) where.category = input.category;
  if (input.city) where.city = { equals: input.city, mode: 'insensitive' };
  if (input.deadlineBefore || input.deadlineAfter) {
    where.deadline = {
      ...(input.deadlineBefore ? { lte: input.deadlineBefore } : {}),
      ...(input.deadlineAfter ? { gte: input.deadlineAfter } : {}),
    };
  }

  return where;
}
