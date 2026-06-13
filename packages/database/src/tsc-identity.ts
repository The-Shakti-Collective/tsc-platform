import type { Prisma } from '@prisma/client';

export const TSC_IDENTITY_NAMESPACES = [
  'artist',
  'community',
  'brand',
  'fan',
] as const;

export type TscIdentityNamespaceValue = (typeof TSC_IDENTITY_NAMESPACES)[number];

export const TSC_IDENTITY_ENTITY_TYPES = [
  'Artist',
  'Community',
  'Brand',
  'Person',
  'Venue',
] as const;

export type TscIdentityEntityTypeValue = (typeof TSC_IDENTITY_ENTITY_TYPES)[number];

export const TSC_VERIFICATION_BADGES = [
  'verified_artist',
  'verified_community',
  'verified_venue',
  'verified_brand_partner',
] as const;

export type TscVerificationBadgeValue = (typeof TSC_VERIFICATION_BADGES)[number];

export const TSC_VERIFICATION_BADGE_LABELS: Record<TscVerificationBadgeValue, string> = {
  verified_artist: 'Verified Artist',
  verified_community: 'Verified Community',
  verified_venue: 'Verified Venue',
  verified_brand_partner: 'Verified Brand Partner',
};

export const TSC_IDENTITY_ROUTE_PREFIX: Record<TscIdentityNamespaceValue, string> = {
  artist: '/a',
  community: '/c',
  brand: '/b',
  fan: '/f',
};

export const TSC_IDENTITY_MODELS = ['TscIdentity'] as const;

export function namespaceForEntityType(
  entityType: TscIdentityEntityTypeValue,
): TscIdentityNamespaceValue {
  switch (entityType) {
    case 'Artist':
      return 'artist';
    case 'Community':
      return 'community';
    case 'Brand':
      return 'brand';
    case 'Person':
      return 'fan';
    case 'Venue':
      return 'community';
    default:
      return 'fan';
  }
}

export function entityTypeForNamespace(
  namespace: TscIdentityNamespaceValue,
): TscIdentityEntityTypeValue {
  switch (namespace) {
    case 'artist':
      return 'Artist';
    case 'community':
      return 'Community';
    case 'brand':
      return 'Brand';
    case 'fan':
      return 'Person';
    default:
      return 'Person';
  }
}

export function buildTscPublicBaseUrl(): string {
  return (process.env.TSC_PUBLIC_URL ?? 'https://tsc.in').replace(/\/$/, '');
}

/** Permanent TSC ID: artist.tsc/ritviz */
export function buildTscIdentityHandle(
  namespace: TscIdentityNamespaceValue,
  slug: string,
): string {
  return `${namespace}.tsc/${slug}`;
}

/** Canonical public URL stored on TscIdentity.canonicalUrl */
export function buildTscCanonicalUrl(
  namespace: TscIdentityNamespaceValue,
  slug: string,
): string {
  const base = buildTscPublicBaseUrl();
  return `${base}/${namespace}.tsc/${slug}`;
}

/** UI route alias: /a/ritviz, /c/underground, etc. */
export function buildTscRoutePath(
  namespace: TscIdentityNamespaceValue,
  slug: string,
): string {
  const prefix = TSC_IDENTITY_ROUTE_PREFIX[namespace];
  return `${prefix}/${slug}`;
}

/** Fan profiles also resolve at /profile/:slug */
export function buildFanProfileRoutePath(slug: string): string {
  return `/profile/${slug}`;
}

export function tscIdentitySlugWhere(
  namespace: TscIdentityNamespaceValue,
  slug: string,
): Prisma.TscIdentityWhereInput {
  return { namespace, slug, isPublic: true };
}

export function tscIdentityEntityWhere(
  entityType: TscIdentityEntityTypeValue,
  entityId: string,
): Prisma.TscIdentityWhereInput {
  return { entityType, entityId };
}

export function badgeForEntityType(
  entityType: TscIdentityEntityTypeValue,
): TscVerificationBadgeValue {
  switch (entityType) {
    case 'Artist':
      return 'verified_artist';
    case 'Community':
      return 'verified_community';
    case 'Venue':
      return 'verified_venue';
    case 'Brand':
      return 'verified_brand_partner';
    default:
      return 'verified_artist';
  }
}

export function slugifyTscIdentity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
