export interface ProfileLink {
  label: string;
  url: string;
}

export interface PersonRoleDisplay {
  role: string;
  entityType: string | null;
  entityId: string | null;
  label: string | null;
}

import type { CreativeIdentityMergeSummary } from './creative-identity.js';

export interface PersonProfileRecord {
  id: string;
  personId: string;
  username: string | null;
  slug: string;
  bio: string | null;
  city: string | null;
  genres: string[];
  skills: string[];
  links: ProfileLink[];
  verificationLevel: number;
  reputationScore: number | null;
  ecosystemScore: number | null;
  displayName: string;
  roles: PersonRoleDisplay[];
  shareUrl: string;
  /** Phase 13 — merged creative identity public summary when available */
  creativeIdentity?: CreativeIdentityMergeSummary | null;
  updatedAt: string;
}

export type PublicPersonProfile = PersonProfileRecord;

export interface PersonProfileEditInput {
  bio?: string | null;
  city?: string | null;
  genres?: string[];
  skills?: string[];
  links?: ProfileLink[];
  username?: string | null;
}

export interface UsernameCheckInput {
  username: string;
}

export interface UsernameCheckPayload {
  username: string;
  available: boolean;
  suggestion?: string;
}

export interface VerificationBreakdown {
  level: number;
  label: string;
  satisfied: boolean;
  detail?: string;
}

export interface VerificationPayload {
  personId: string;
  level: number;
  maxComputedLevel: number;
  adminVerified: boolean;
  breakdown: VerificationBreakdown[];
  updatedAt: string;
}

export interface CommunityVerificationRequestPayload {
  personId: string;
  status: 'pending';
  message: string;
  requestId?: string;
}

export interface EcosystemPassportSectionItem {
  id: string;
  relationshipType: string;
  entityType: string;
  entityId: string;
  title: string;
  effectiveFrom: string | null;
  metadata: Record<string, unknown>;
}

export interface EcosystemPassportPayload {
  slug: string;
  shareUrl: string;
  identity: {
    personId: string;
    displayName: string;
    username: string | null;
    bio: string | null;
    city: string | null;
    genres: string[];
    skills: string[];
    links: ProfileLink[];
    photoUrl: string | null;
    roles: PersonRoleDisplay[];
    verificationLevel: number;
  };
  communities: EcosystemPassportSectionItem[];
  events: EcosystemPassportSectionItem[];
  opportunities: Array<{
    opportunityId: string;
    title: string;
    category: string | null;
    status: string;
    appliedAt: string | null;
  }>;
  collaborations: EcosystemPassportSectionItem[];
  reputation: {
    reputationScore: number | null;
    ecosystemScore: number | null;
    ecosystemRankPercentile: number | null;
    healthScore: number | null;
    communityScore: number | null;
    activityScore: number | null;
  };
  artistPassportAvailable: boolean;
  /** Phase 13 — link to canonical creative identity view */
  creativeIdentity?: CreativeIdentityMergeSummary | null;
  updatedAt: string;
}
