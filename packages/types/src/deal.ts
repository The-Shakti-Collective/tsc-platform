export const DEAL_STATUSES = [
  'application',
  'discussion',
  'negotiation',
  'agreement',
  'completed',
  'paid',
] as const;

export type DealStatus = (typeof DEAL_STATUSES)[number];

export const REVENUE_TRANSACTION_TYPES = ['expected', 'received', 'pending'] as const;

export type RevenueTransactionType = (typeof REVENUE_TRANSACTION_TYPES)[number];

export interface DealSummary {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  applicationId: string | null;
  artistId: string;
  artistName: string | null;
  brandId: string | null;
  brandName: string | null;
  agencyId: string | null;
  agencyName: string | null;
  status: DealStatus;
  value: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  negotiationNotes: string | null;
  agreementUrl: string | null;
  paidAt: string | null;
  revenueCount: number;
  createdAt: string;
  updatedAt: string;
}

export type DealDetail = DealSummary;

export interface DealListPayload {
  items: DealSummary[];
  filters: {
    artistId: string | null;
    brandId: string | null;
    status: DealStatus | null;
  };
  updatedAt: string;
}

export interface DealCreatedPayload {
  id: string;
  opportunityId: string;
  applicationId: string | null;
  artistId: string;
  brandId: string | null;
  status: DealStatus;
  createdAt: string;
}

export interface DealStatusUpdatePayload {
  id: string;
  status: DealStatus;
  previousStatus: DealStatus;
  paidAt: string | null;
  updatedAt: string;
}

export interface RevenueTransactionSummary {
  id: string;
  dealId: string;
  amount: number;
  type: RevenueTransactionType;
  recordedAt: string;
  notes: string | null;
}

export interface DealRevenuePayload {
  dealId: string;
  items: RevenueTransactionSummary[];
  totals: {
    expected: number;
    received: number;
    pending: number;
  };
  updatedAt: string;
}

export interface DealPipelinePayload {
  stages: Array<{
    status: DealStatus;
    count: number;
    items: DealSummary[];
  }>;
  updatedAt: string;
}
