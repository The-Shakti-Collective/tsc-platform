export const IDENTIFIER_PROVIDERS = [
  'email',
  'phone',
  'instagram',
  'spotify',
  'tiktok',
  'twitter',
  'community_account',
  'coreknot_user',
  'website',
  'other',
] as const;

export type IdentifierProvider = (typeof IDENTIFIER_PROVIDERS)[number];

export const PERSON_ROLE_TYPES = [
  'artist',
  'manager',
  'fan',
  'community_leader',
  'booker',
  'curator',
  'brand_rep',
  'organizer',
  'other',
] as const;

export type PersonRoleType = (typeof PERSON_ROLE_TYPES)[number];

export const PERSON_ROLE_STATUSES = ['active', 'inactive', 'pending'] as const;

export type PersonRoleStatus = (typeof PERSON_ROLE_STATUSES)[number];

export const IDENTITY_MERGE_REASONS = [
  'manual',
  'auto_match',
  'sync_reconcile',
  'admin_override',
] as const;

export type IdentityMergeReason = (typeof IDENTITY_MERGE_REASONS)[number];

export interface PersonIdentifierRecord {
  id: string;
  personId: string;
  provider: IdentifierProvider;
  externalId: string;
  normalizedId: string | null;
  verified: boolean;
  primary: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PersonRoleRecord {
  id: string;
  personId: string;
  role: PersonRoleType;
  status: PersonRoleStatus;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  assignedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IdentityMergeLogRecord {
  id: string;
  survivorPersonId: string;
  mergedPersonId: string;
  reason: IdentityMergeReason;
  matchSignals: Record<string, unknown> | null;
  conflictResolutions: Record<string, unknown> | null;
  mergedBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface IncomingIdentifier {
  provider: IdentifierProvider;
  externalId: string;
  verified?: boolean;
  primary?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ResolveIdentityInput {
  identifiers: IncomingIdentifier[];
  name?: string;
  displayName?: string;
  roles?: Array<{
    role: PersonRoleType;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }>;
  createIfMissing?: boolean;
  source?: string;
}

export interface IdentityMatchSignal {
  provider: IdentifierProvider;
  externalId: string;
  normalizedId: string;
  matchType: 'exact' | 'normalized' | 'fuzzy';
  confidence: number;
  personId: string;
}

export interface ResolveIdentityPayload {
  personId: string;
  created: boolean;
  matched: boolean;
  confidence: number;
  matchSignals: IdentityMatchSignal[];
  person: PersonCoreSummary;
}

export interface MergeIdentityInput {
  survivorPersonId: string;
  mergedPersonIds: string[];
  reason?: IdentityMergeReason;
  mergedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface MergeConflictResolution {
  field: string;
  survivorValue: unknown;
  mergedValue: unknown;
  chosen: 'survivor' | 'merged' | 'combined';
}

export interface MergeIdentityPayload {
  survivorPersonId: string;
  mergedPersonIds: string[];
  conflictResolutions: MergeConflictResolution[];
  mergeLogIds: string[];
  person360: Person360Payload;
}

export interface PersonCoreSummary {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  mergedIntoId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedEntityRef {
  entityType: string;
  entityId: string;
  label: string | null;
  role?: string | null;
  linkedAt?: string | null;
}

export interface RelationshipSummary {
  id: string;
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  relationshipType: string;
  metadata: Record<string, unknown>;
}

export interface Person360Payload {
  person: PersonCoreSummary;
  identifiers: PersonIdentifierRecord[];
  roles: PersonRoleRecord[];
  linkedEntities: {
    artists: LinkedEntityRef[];
    communities: LinkedEntityRef[];
    events: LinkedEntityRef[];
    opportunities: LinkedEntityRef[];
  };
  relationships: RelationshipSummary[];
  mergeHistory: IdentityMergeLogRecord[];
  updatedAt: string;
}
