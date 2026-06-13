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

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

export const OPPORTUNITY_APPLICATION_STATUSES = [
  'saved',
  'applied',
  'shortlisted',
  'won',
  'rejected',
] as const;

export type OpportunityApplicationStatus =
  (typeof OPPORTUNITY_APPLICATION_STATUSES)[number];

export interface MarketplaceOpportunitySummary {
  id: string;
  title: string;
  category: OpportunityCategory | null;
  city: string | null;
  deadline: string | null;
  status: string;
  value: number | null;
  source: string | null;
  organizationName: string | null;
  applicationCount: number;
  updatedAt: string;
  /** From intelligence layer when available — read-only */
  matchScore?: number | null;
}

export interface MarketplaceOpportunityDetail extends MarketplaceOpportunitySummary {
  description: string | null;
  artistId: string | null;
  metadata: Record<string, unknown>;
  myApplication: OpportunityApplicationSummary | null;
}

export interface OpportunityApplicationSummary {
  id: string;
  opportunityId: string;
  personId: string;
  artistId: string | null;
  status: OpportunityApplicationStatus;
  appliedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  opportunity?: {
    id: string;
    title: string;
    category: OpportunityCategory | null;
    city: string | null;
    deadline: string | null;
    status: string;
    value: number | null;
  };
}

export interface MarketplaceBrowsePayload {
  items: MarketplaceOpportunitySummary[];
  filters: {
    category: OpportunityCategory | null;
    city: string | null;
    deadlineBefore: string | null;
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

export interface OpportunitySharePayload {
  opportunityId: string;
  shareUrl: string;
  message: string;
  stubbed: true;
}
