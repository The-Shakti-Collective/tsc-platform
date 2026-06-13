import type { Prisma } from '@prisma/client';

// BrandInclude / AgencyInclude types resolve after Person relations are merged.

export const BRAND_STATUSES = ['active', 'pending', 'archived'] as const;
export type BrandStatusValue = (typeof BRAND_STATUSES)[number];

export const BRAND_BUDGET_RANGES = [
  'under_5l',
  'five_to_25l',
  'twenty_five_to_1cr',
  'over_1cr',
  'undisclosed',
] as const;
export type BrandBudgetRangeValue = (typeof BRAND_BUDGET_RANGES)[number];

export const MANAGES_RELATIONSHIP = 'MANAGES' as const;
export const SIGNED_TO_RELATIONSHIP = 'SIGNED_TO' as const;
export const SPONSORED_BY_RELATIONSHIP = 'SPONSORED_BY' as const;

/** Extend with owner/_count after Person + Opportunity relations merged. */
export const brandInclude = {} as const;

export const agencyInclude = {} as const;

export const labelInclude = {} as const;

export function brandListWhere(input: {
  industry?: string;
  city?: string;
  status?: BrandStatusValue;
  verified?: boolean;
}): Prisma.BrandWhereInput {
  const where: Prisma.BrandWhereInput = {};
  if (input.industry) where.industry = { equals: input.industry, mode: 'insensitive' };
  if (input.city) where.city = { equals: input.city, mode: 'insensitive' };
  if (input.status) where.status = input.status;
  if (input.verified !== undefined) where.verified = input.verified;
  return where;
}

export function agencyListWhere(input: { city?: string }): Prisma.AgencyWhereInput {
  const where: Prisma.AgencyWhereInput = {};
  if (input.city) where.city = { equals: input.city, mode: 'insensitive' };
  return where;
}

export function labelListWhere(input: { genre?: string; city?: string }): Prisma.LabelWhereInput {
  const where: Prisma.LabelWhereInput = {};
  if (input.genre) where.genre = { equals: input.genre, mode: 'insensitive' };
  if (input.city) where.city = { equals: input.city, mode: 'insensitive' };
  return where;
}

export function managedArtistsWhere(
  sourceEntityType: 'Agency' | 'Person' | 'Label',
  sourceEntityId: string,
  relationshipType: typeof MANAGES_RELATIONSHIP | typeof SIGNED_TO_RELATIONSHIP = MANAGES_RELATIONSHIP,
): Prisma.RelationshipWhereInput {
  return {
    sourceEntityType,
    sourceEntityId,
    relationshipType,
    targetEntityType: 'Artist',
    AND: [
      { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: new Date() } }] },
      { OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }] },
    ],
  };
}
