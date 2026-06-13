import type { OpportunityApplicationStatus, OpportunityCategory } from './marketplace.js';

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

export type MarketplaceListingType = (typeof MARKETPLACE_LISTING_TYPES)[number];

export type MarketplaceOwnerType = 'brand' | 'agency' | 'artist';

export interface MarketplaceListingSummary {
  id: string;
  title: string;
  listingType: MarketplaceListingType;
  category: OpportunityCategory | null;
  ownerType: MarketplaceOwnerType | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerVerified?: boolean;
  budget: number | null;
  city: string | null;
  genre: string | null;
  status: string;
  requirements: string[];
  deadline: string | null;
  source: string | null;
  applicationCount: number;
  updatedAt: string;
  /** Read-only from Phase 5 intelligence — not recomputed here */
  matchScore?: number | null;
}

export interface MarketplaceListingDetail extends MarketplaceListingSummary {
  description: string | null;
  myApplication: BrandApplicationSummary | null;
}

export interface MarketplaceListingsPayload {
  items: MarketplaceListingSummary[];
  filters: {
    type: MarketplaceListingType | null;
    city: string | null;
    genre: string | null;
  };
  suggested: Array<{
    id: string;
    title: string;
    reason: string;
    score: number;
    source: string;
  }>;
  updatedAt: string;
}

export interface MarketplaceSearchPayload {
  query: string | null;
  items: MarketplaceListingSummary[];
  filters: {
    type: MarketplaceListingType | null;
    city: string | null;
    genre: string | null;
  };
  total: number;
  updatedAt: string;
}

export interface MarketplaceTrackPayload {
  listingId: string;
  tracked: true;
  stubbed?: boolean;
  message?: string;
}

export type BrandApplicationReviewAction = 'shortlist' | 'reject' | 'hire';

export interface BrandApplicationSummary {
  id: string;
  opportunityId: string;
  listingTitle: string;
  listingType: MarketplaceListingType | null;
  personId: string;
  personName: string | null;
  artistId: string | null;
  artistName: string | null;
  artistGenre: string | null;
  status: OpportunityApplicationStatus;
  appliedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandApplicationsPayload {
  brandId: string;
  items: BrandApplicationSummary[];
  filters: {
    status: OpportunityApplicationStatus | null;
    opportunityId: string | null;
  };
  updatedAt: string;
}

export interface BrandApplicationReviewPayload {
  applicationId: string;
  brandId: string;
  action: BrandApplicationReviewAction;
  status: OpportunityApplicationStatus;
  updatedAt: string;
}
