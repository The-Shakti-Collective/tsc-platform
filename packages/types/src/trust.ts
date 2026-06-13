export const TRUST_ENTITY_TYPES = ['Artist', 'Brand', 'Agency'] as const;
export type TrustEntityTypeValue = (typeof TRUST_ENTITY_TYPES)[number];

export interface ArtistTrustFactors {
  attendance: number;
  responseRate: number;
  completedDeals: number;
  communityParticipation: number;
  collaborations: number;
}

export interface BrandTrustFactors {
  paymentsRecorded: number;
  dealCompletion: number;
  artistReviews: number;
}

export interface AgencyTrustFactors {
  rosterGrowth: number;
  campaignSuccess: number;
}

export interface TrustSnapshotPayload {
  entityType: TrustEntityTypeValue;
  entityId: string;
  trustScore: number;
  factors: ArtistTrustFactors | BrandTrustFactors | AgencyTrustFactors;
  badges: string[];
  rankPercentile: number | null;
  snapshotDate: string;
  updatedAt: string;
}

export interface TrustRefreshPayload {
  entityType: TrustEntityTypeValue;
  entityId: string;
  snapshot: TrustSnapshotPayload;
  entityUpdated: boolean;
}

export interface TrustBadgeInfo {
  entityType: TrustEntityTypeValue | 'Person';
  entityId: string;
  trustScore: number | null;
  badges: string[];
  label: string | null;
}
