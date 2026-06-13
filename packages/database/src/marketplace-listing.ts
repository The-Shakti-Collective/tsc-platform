import type { Prisma } from '@prisma/client';
import {
  MARKETPLACE_OPPORTUNITY_STATUSES,
  marketplaceOpportunityInclude,
  type OpportunityCategoryValue,
} from './marketplace.js';

export const MARKETPLACE_LISTING_TYPES = [
  'brand_campaign',
  'festival_slot',
  'opening_act',
  'workshop',
  'grant',
  'residency',
  'sync_licensing',
  'collaboration',
] as const;

export type MarketplaceListingTypeValue = (typeof MARKETPLACE_LISTING_TYPES)[number];

export const MARKETPLACE_OWNER_TYPES = ['brand', 'agency', 'artist'] as const;

export type MarketplaceOwnerTypeValue = (typeof MARKETPLACE_OWNER_TYPES)[number];

/** Legacy category → Month 2 listing type when listingType is unset. */
export const CATEGORY_TO_LISTING_TYPE: Record<
  OpportunityCategoryValue,
  MarketplaceListingTypeValue
> = {
  brand_deal: 'brand_campaign',
  festival_slot: 'festival_slot',
  workshop: 'workshop',
  collaboration: 'collaboration',
  funding: 'grant',
  residency: 'residency',
  open_call: 'opening_act',
  scholarship: 'grant',
};

/** Listing type filter may match listingType or legacy category. */
export const LISTING_TYPE_TO_CATEGORY: Record<
  MarketplaceListingTypeValue,
  OpportunityCategoryValue
> = {
  brand_campaign: 'brand_deal',
  festival_slot: 'festival_slot',
  opening_act: 'open_call',
  workshop: 'workshop',
  grant: 'funding',
  residency: 'residency',
  sync_licensing: 'brand_deal',
  collaboration: 'collaboration',
};

export const LISTING_TYPE_TO_CATEGORIES: Record<
  MarketplaceListingTypeValue,
  OpportunityCategoryValue[]
> = {
  brand_campaign: ['brand_deal'],
  festival_slot: ['festival_slot'],
  opening_act: ['open_call', 'festival_slot'],
  workshop: ['workshop'],
  grant: ['funding', 'scholarship'],
  residency: ['residency'],
  sync_licensing: ['brand_deal'],
  collaboration: ['collaboration'],
};

export const marketplaceListingInclude = {
  ...marketplaceOpportunityInclude,
  brand: {
    select: { id: true, name: true, logo: true, verified: true },
  },
  agency: {
    select: { id: true, name: true },
  },
} satisfies Prisma.OpportunityInclude;

export function resolveListingType(input: {
  listingType?: string | null;
  category?: string | null;
}): MarketplaceListingTypeValue {
  if (
    input.listingType &&
    MARKETPLACE_LISTING_TYPES.includes(input.listingType as MarketplaceListingTypeValue)
  ) {
    return input.listingType as MarketplaceListingTypeValue;
  }
  const category = input.category as OpportunityCategoryValue | undefined;
  if (category && CATEGORY_TO_LISTING_TYPE[category]) {
    return CATEGORY_TO_LISTING_TYPE[category];
  }
  return 'collaboration';
}

export function marketplaceListingBrowseWhere(input: {
  type?: MarketplaceListingTypeValue;
  city?: string;
  genre?: string;
  ownerId?: string;
  ownerType?: MarketplaceOwnerTypeValue;
}): Prisma.OpportunityWhereInput {
  const where: Prisma.OpportunityWhereInput = {
    marketplaceVisible: true,
    status: { in: [...MARKETPLACE_OPPORTUNITY_STATUSES] },
  };

  if (input.type) {
    const categories = LISTING_TYPE_TO_CATEGORIES[input.type];
    where.OR = [
      { listingType: input.type },
      { listingType: null, category: { in: categories } },
    ];
  }

  if (input.city) {
    where.city = { equals: input.city, mode: 'insensitive' };
  }

  if (input.genre) {
    where.genre = { equals: input.genre, mode: 'insensitive' };
  }

  if (input.ownerId && input.ownerType) {
    if (input.ownerType === 'brand') {
      where.brandId = input.ownerId;
    } else if (input.ownerType === 'agency') {
      where.agencyId = input.ownerId;
    } else {
      where.ownerId = input.ownerId;
      where.ownerType = input.ownerType;
    }
  }

  return where;
}

export function marketplaceListingSearchWhere(input: {
  q?: string;
  type?: MarketplaceListingTypeValue;
  city?: string;
  genre?: string;
}): Prisma.OpportunityWhereInput {
  const base = marketplaceListingBrowseWhere({
    type: input.type,
    city: input.city,
    genre: input.genre,
  });

  if (!input.q?.trim()) {
    return base;
  }

  const term = input.q.trim();
  return {
    AND: [
      base,
      {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { genre: { contains: term, mode: 'insensitive' } },
        ],
      },
    ],
  };
}

export const brandApplicationInclude = {
  opportunity: {
    select: {
      id: true,
      title: true,
      listingType: true,
      category: true,
      city: true,
      brandId: true,
      status: true,
    },
  },
  person: {
    select: { id: true, displayName: true, name: true, email: true },
  },
  artist: {
    select: { id: true, name: true, slug: true },
  },
} satisfies Prisma.OpportunityApplicationInclude;
