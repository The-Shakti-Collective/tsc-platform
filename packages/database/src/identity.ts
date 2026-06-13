import type { Prisma } from '@prisma/client';

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

export type IdentifierProviderValue = (typeof IDENTIFIER_PROVIDERS)[number];

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

export type PersonRoleTypeValue = (typeof PERSON_ROLE_TYPES)[number];

export const PERSON_ROLE_STATUSES = ['active', 'inactive', 'pending'] as const;

export type PersonRoleStatusValue = (typeof PERSON_ROLE_STATUSES)[number];

export const IDENTITY_MERGE_REASONS = [
  'manual',
  'auto_match',
  'sync_reconcile',
  'admin_override',
] as const;

export type IdentityMergeReasonValue = (typeof IDENTITY_MERGE_REASONS)[number];

export const SOCIAL_IDENTIFIER_PROVIDERS: IdentifierProviderValue[] = [
  'instagram',
  'spotify',
  'tiktok',
  'twitter',
  'community_account',
  'website',
];

export const personIdentifierInclude = {
  person: {
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      phone: true,
      mergedIntoId: true,
    },
  },
} satisfies Prisma.PersonIdentifierInclude;

export const personRoleInclude = {
  person: {
    select: { id: true, name: true, displayName: true },
  },
} satisfies Prisma.PersonRoleInclude;

export const person360Include = {
  identifiers: { orderBy: { createdAt: 'asc' as const } },
  roles: { where: { status: 'active' }, orderBy: { assignedAt: 'desc' as const } },
  mergeLogs: { orderBy: { createdAt: 'desc' as const }, take: 50 },
  profile: true,
} satisfies Prisma.PersonInclude;

export function activePersonWhere(): Prisma.PersonWhereInput {
  return { mergedIntoId: null };
}

export function identifierLookupWhere(input: {
  provider: IdentifierProviderValue;
  externalId: string;
  normalizedId?: string | null;
}): Prisma.PersonIdentifierWhereInput {
  const normalized = input.normalizedId ?? input.externalId;
  return {
    provider: input.provider,
    OR: [{ externalId: input.externalId }, { normalizedId: normalized }],
    person: activePersonWhere(),
  };
}

export function personRoleDedupeKey(role: {
  role: string;
  entityType?: string | null;
  entityId?: string | null;
}): string {
  return `${role.role}:${role.entityType ?? ''}:${role.entityId ?? ''}`;
}

export const IDENTITY_MODELS = [
  'PersonIdentifier',
  'PersonRole',
  'IdentityMergeLog',
] as const;
