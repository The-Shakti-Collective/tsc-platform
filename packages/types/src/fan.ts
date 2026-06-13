/** Phase 8 Step 1 — Universal Fan Identity types. */

import type { EntitySubgraphResponse } from './relationship.js';

export interface FanProfileRecord {
  personId: string;
  favoriteGenres: string[];
  favoriteArtists: string[];
  cities: string[];
  engagementScore: number;
  spendScore: number;
  attendanceScore: number;
  influenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface FanProfilePublic {
  personId: string;
  favoriteGenres: string[];
  favoriteArtists: string[];
  cities: string[];
  engagementScore: number | null;
  attendanceScore: number | null;
  updatedAt: string;
}

export interface FanScoresPayload {
  personId: string;
  engagementScore: number;
  spendScore: number;
  attendanceScore: number;
  influenceScore: number;
  source: 'snapshot' | 'profile' | 'stub';
  snapshotDate: string | null;
  updatedAt: string;
}

export interface FanGraphPayload extends EntitySubgraphResponse {
  personId: string;
  fanEdges: {
    follows: Array<{ artistId: string; title: string | null }>;
    attended: Array<{ eventId: string; title: string | null }>;
    communities: Array<{ communityId: string; title: string | null }>;
    supported: Array<{ artistId: string; title: string | null }>;
  };
}

export interface ArtistFanSummary {
  personId: string;
  displayName: string;
  slug: string | null;
  engagementScore: number;
  attendanceScore: number;
  followedAt: string | null;
}

export interface ArtistFansPayload {
  artistId: string;
  fans: ArtistFanSummary[];
  total: number;
  updatedAt: string;
}

export interface FanFollowArtistPayload {
  artistId: string;
  personId: string;
  relationshipId: string;
  artistFollowId: string | null;
  created: boolean;
  updatedAt: string;
}

export interface FanSupportArtistPayload {
  artistId: string;
  personId: string;
  relationshipId: string;
  created: boolean;
  updatedAt: string;
}

export interface FanProfilePatchInput {
  favoriteGenres?: string[];
  favoriteArtists?: string[];
  cities?: string[];
}

/** Phase 8 Step 2 — Superfan Engine types. */

export type SuperfanTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend';

export interface SuperfanFactors {
  eventsAttended: number;
  purchases: number;
  community: number;
  referrals: number;
  membershipDuration: number;
  raw?: {
    checkedInCount: number;
    registeredCount: number;
    purchaseCount: number;
    spendScore: number;
    communityCount: number;
    referralCount: number;
    membershipMonths: number;
  };
}

export interface SuperfanPayload {
  personId: string;
  artistId: string | null;
  superfanScore: number;
  tier: SuperfanTier;
  factors: SuperfanFactors;
  snapshotDate: string;
  updatedAt: string;
}

export interface SuperfanRefreshPayload extends SuperfanPayload {
  previousTier: SuperfanTier | null;
  platinumCreditAwarded: boolean;
}

export interface ArtistSuperfanSummary {
  personId: string;
  displayName: string;
  slug: string | null;
  superfanScore: number;
  tier: SuperfanTier;
  snapshotDate: string | null;
}

export interface ArtistSuperfansPayload {
  artistId: string;
  superfans: ArtistSuperfanSummary[];
  total: number;
  updatedAt: string;
}

export interface SuperfanSegmentCount {
  tier: SuperfanTier;
  count: number;
}

export interface ArtistSuperfanSegmentsPayload {
  artistId: string;
  segments: SuperfanSegmentCount[];
  totalFans: number;
  updatedAt: string;
}
