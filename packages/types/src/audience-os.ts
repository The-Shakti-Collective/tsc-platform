/** Phase 8 Step 9 — Audience OS unified dashboard types. */

export interface AudienceMapCity {
  city: string;
  fanCount: number;
  eventParticipationCount: number;
  densityScore: number;
}

export interface ArtistAudienceOSTopFan {
  personId: string;
  displayName: string;
  slug: string | null;
  source: 'superfan' | 'supporter';
  score: number;
  tier?: string;
  totalSpent?: number;
  supportCount?: number;
}

export interface ArtistRevenueStub {
  supportTotal: number;
  purchaseTotal: number;
  dealTotal: number;
  combinedTotal: number;
  currency: string;
  breakdown: {
    support: number;
    purchases: number;
    deals: number;
  };
}

export interface ArtistMembershipStub {
  activeSubscriptions: number;
  mrrStub: number;
  currency: string;
  programsCount: number;
}

export interface CommerceBreakdown {
  tickets: { count: number; revenue: number };
  merch: { count: number; revenue: number };
  experiences: { count: number; revenue: number };
  total: number;
  currency: string;
}

export interface ArtistAudienceOSDashboardPayload {
  artistId: string;
  name: string;
  slug: string | null;
  audienceMap: AudienceMapCity[];
  topFans: ArtistAudienceOSTopFan[];
  revenue: ArtistRevenueStub;
  retention: {
    fanRetention: number;
    audienceChurn: number;
    fanConversion: number;
    lifetimeValueStub: number;
    snapshotDate: string;
  };
  growth: {
    audienceGrowth: number;
    snapshotDate: string;
    metrics: Record<string, unknown>;
  };
  membership: ArtistMembershipStub;
  commerce: CommerceBreakdown;
  updatedAt: string;
}

export interface CommunityTopContributor {
  personId: string;
  name: string;
  activityCount30d: number;
  lastActiveAt: string | null;
}

export interface MembershipProgramStat {
  programId: string;
  name: string;
  tier: string;
  price: number;
  currency: string;
  activeSubscriptions: number;
  revenueStub: number;
}

export interface CommunityAudienceOSDashboardPayload {
  communityId: string;
  name: string;
  slug: string | null;
  activeMembers: number;
  membershipRevenueStub: number;
  fanGrowth: number;
  eventConversion: number;
  memberGrowth: number;
  snapshotDate: string;
  topContributors: CommunityTopContributor[];
  membershipPrograms: MembershipProgramStat[];
  updatedAt: string;
}

export interface ArtistAudienceOSExportPayload {
  artistId: string;
  exportedAt: string;
  format: 'json';
  dashboard: ArtistAudienceOSDashboardPayload;
}
