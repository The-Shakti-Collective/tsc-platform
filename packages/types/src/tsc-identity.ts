import type {
  TscIdentityEntityTypeValue,
  TscIdentityNamespaceValue,
  TscVerificationBadgeValue,
} from '@tsc/database';

export type TscIdentityNamespace = TscIdentityNamespaceValue;
export type TscIdentityEntityType = TscIdentityEntityTypeValue;
export type TscVerificationBadge = TscVerificationBadgeValue;

export interface TscIdentityRecord {
  id: string;
  entityType: TscIdentityEntityType;
  entityId: string;
  namespace: TscIdentityNamespace;
  slug: string;
  handle: string;
  canonicalUrl: string;
  routePath: string;
  isPublic: boolean;
  verifiedBadge: TscVerificationBadge | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TscIdentityPublicPayload {
  identity: TscIdentityRecord;
  displayName: string | null;
  badges: TscVerificationBadgeEntry[];
}

export interface TscVerificationBadgeEntry {
  badge: TscVerificationBadge;
  label: string;
  source: 'admin' | 'computed' | 'trust';
  grantedAt: string | null;
}

export interface TscVerificationBadgesPayload {
  entityType: TscIdentityEntityType;
  entityId: string;
  badges: TscVerificationBadgeEntry[];
  tscIdentity: Pick<TscIdentityRecord, 'namespace' | 'slug' | 'handle' | 'canonicalUrl' | 'routePath'> | null;
  updatedAt: string;
}

export interface TscIdentityNetworkPayload {
  personId: string;
  identities: TscIdentityRecord[];
  badges: TscVerificationBadgeEntry[];
  updatedAt: string;
}

export interface AdminIdentityVerifyInput {
  badge: TscVerificationBadge;
  isPublic?: boolean;
}

export interface AdminIdentityVerifyPayload {
  entityType: TscIdentityEntityType;
  entityId: string;
  identity: TscIdentityRecord;
  badges: TscVerificationBadgeEntry[];
}
