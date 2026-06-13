export interface PassportLink {
  label: string;
  url: string;
}

export interface PassportIdentity {
  artistId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  links: PassportLink[];
}

export interface PassportCareerEvent {
  id: string;
  relationshipType: 'PERFORMED_AT' | 'MEMBER_OF' | 'COLLABORATED_WITH';
  entityType: string;
  entityId: string;
  title: string;
  effectiveFrom: string | null;
  metadata: Record<string, unknown>;
}

export interface PassportOpportunityHistoryItem {
  opportunityId: string;
  title: string;
  category: string | null;
  status: string;
  appliedAt: string | null;
}

export interface PassportReputation {
  healthScore: number | null;
  communityScore: number | null;
  activityScore: number | null;
  healthSnapshotDate: string | null;
  communitySnapshotDate: string | null;
  /** Read from ArtistHealthSnapshot.dimensions — not recalculated */
  dimensions: Record<string, number> | null;
  visibility: {
    showHealthScore: boolean;
    showCommunityScore: boolean;
    showActivityScore: boolean;
  };
}

export interface PassportPayload {
  identity: PassportIdentity;
  career: {
    eventsPlayed: PassportCareerEvent[];
    communities: PassportCareerEvent[];
    collaborations: PassportCareerEvent[];
  };
  opportunityHistory: PassportOpportunityHistoryItem[];
  reputation: PassportReputation;
  ecosystemScore: number | null;
  isPublic: boolean;
  shareUrl: string;
  updatedAt: string;
}

/** Public view — omits private fields per visibility flags */
export type PublicPassportPayload = PassportPayload;

export interface PassportEditInput {
  isPublic?: boolean;
  showHealthScore?: boolean;
  showCommunityScore?: boolean;
  showActivityScore?: boolean;
  showOpportunityHistory?: boolean;
  showCareerGraph?: boolean;
  headline?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  links?: PassportLink[];
}

export interface PassportCardSummary {
  slug: string;
  displayName: string;
  headline: string | null;
  photoUrl: string | null;
  ecosystemScore: number | null;
  healthScore: number | null;
  shareUrl: string;
}
