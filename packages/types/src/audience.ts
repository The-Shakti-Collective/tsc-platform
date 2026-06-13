/** Phase 8 Step 5 — Audience Intelligence V2 types. */

export interface AudienceHealthSnapshotPayload {
  artistId: string;
  snapshotDate: string;
  audienceGrowth: number;
  audienceChurn: number;
  fanRetention: number;
  fanConversion: number;
  lifetimeValueStub: number;
  metrics: Record<string, unknown>;
  updatedAt: string;
}

export interface AudienceHealthRefreshPayload extends AudienceHealthSnapshotPayload {
  previousSnapshotDate: string | null;
  recomputed: true;
}

export interface CommunityAudienceSnapshotPayload {
  communityId: string;
  snapshotDate: string;
  memberGrowth: number;
  activeMembers: number;
  membershipRevenueStub: number;
  fanGrowth: number;
  eventConversion: number;
  metrics: Record<string, unknown>;
  updatedAt: string;
}

export interface CommunityAudienceRefreshPayload extends CommunityAudienceSnapshotPayload {
  previousSnapshotDate: string | null;
  recomputed: true;
}

export interface TopGrowthArtistInsight {
  artistId: string;
  name: string;
  slug: string | null;
  audienceGrowth: number;
  fanRetention: number;
  lifetimeValueStub: number;
  snapshotDate: string;
}

export interface TopGrowthArtistsPayload {
  artists: TopGrowthArtistInsight[];
  threshold: number;
  updatedAt: string;
}

export interface ChurnRiskArtistInsight {
  artistId: string;
  name: string;
  slug: string | null;
  fanRetention: number;
  audienceChurn: number;
  audienceGrowth: number;
  snapshotDate: string;
  riskLevel: 'elevated' | 'high';
}

export interface ChurnRiskArtistsPayload {
  artists: ChurnRiskArtistInsight[];
  threshold: number;
  updatedAt: string;
}

export interface CommandCenterAudienceBlock {
  mostLoyalCommunities: Array<{
    communityId: string;
    name: string;
    fanRetention: number;
    memberGrowth: number;
    activeMembers: number;
  }>;
  highestGrowthArtists: TopGrowthArtistInsight[];
  highestChurnRisk: ChurnRiskArtistInsight[];
  updatedAt: string;
}

/** Phase 8 Step 10 — Command Center V4 platform audience KPIs. */
export interface CommandCenterV4AudienceKpis {
  totalFans: number;
  monthlyActiveFans: number;
  superfans: {
    gold: number;
    platinum: number;
    legend: number;
    total: number;
  };
  membershipRevenue: {
    mrrStub: number;
    currency: string;
    activeSubscriptions: number;
  };
  audienceGrowth: number;
  audienceChurn: {
    avgChurn: number;
    churnRiskArtistCount: number;
  };
}
