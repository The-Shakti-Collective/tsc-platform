import {
  buildTscCanonicalUrl,
  buildTscIdentityHandle,
  buildTscRoutePath,
  TSC_VERIFICATION_BADGE_LABELS,
  badgeForEntityType,
  slugifyTscIdentity,
  type TscIdentityEntityTypeValue,
  type TscIdentityNamespaceValue,
  type TscVerificationBadgeValue,
} from '@tsc/database';
import type {
  AdminIdentityVerifyInput,
  AdminIdentityVerifyPayload,
  TscIdentityNetworkPayload,
  TscIdentityPublicPayload,
  TscIdentityRecord,
  TscVerificationBadgeEntry,
  TscVerificationBadgesPayload,
} from '@tsc/types';
import type { TscIdentityRow } from './tsc-identity.repository';

export function toTscIdentityRecord(row: TscIdentityRow): TscIdentityRecord {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    namespace: row.namespace,
    slug: row.slug,
    handle: buildTscIdentityHandle(row.namespace, row.slug),
    canonicalUrl: row.canonicalUrl || buildTscCanonicalUrl(row.namespace, row.slug),
    routePath: buildTscRoutePath(row.namespace, row.slug),
    isPublic: row.isPublic,
    verifiedBadge: row.verifiedBadge,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function badgeEntry(
  badge: TscVerificationBadgeValue,
  source: TscVerificationBadgeEntry['source'],
  grantedAt: string | null = null,
): TscVerificationBadgeEntry {
  return {
    badge,
    label: TSC_VERIFICATION_BADGE_LABELS[badge],
    source,
    grantedAt,
  };
}

export function collectBadgesForIdentity(
  row: TscIdentityRow | null,
  computed: TscVerificationBadgeEntry[] = [],
): TscVerificationBadgeEntry[] {
  const badges: TscVerificationBadgeEntry[] = [...computed];
  if (row?.verifiedBadge) {
    badges.unshift(
      badgeEntry(row.verifiedBadge, 'admin', row.verifiedAt?.toISOString() ?? null),
    );
  }
  return dedupeBadges(badges);
}

export function dedupeBadges(
  badges: TscVerificationBadgeEntry[],
): TscVerificationBadgeEntry[] {
  const seen = new Set<string>();
  return badges.filter((entry) => {
    if (seen.has(entry.badge)) return false;
    seen.add(entry.badge);
    return true;
  });
}

export function buildPublicPayload(
  row: TscIdentityRow,
  displayName: string | null,
  computedBadges: TscVerificationBadgeEntry[] = [],
): TscIdentityPublicPayload {
  return {
    identity: toTscIdentityRecord(row),
    displayName,
    badges: collectBadgesForIdentity(row, computedBadges),
  };
}

export function buildBadgesPayload(
  entityType: TscIdentityEntityTypeValue,
  entityId: string,
  row: TscIdentityRow | null,
  computed: TscVerificationBadgeEntry[],
): TscVerificationBadgesPayload {
  return {
    entityType,
    entityId,
    badges: collectBadgesForIdentity(row, computed),
    tscIdentity: row
      ? {
          namespace: row.namespace,
          slug: row.slug,
          handle: buildTscIdentityHandle(row.namespace, row.slug),
          canonicalUrl: row.canonicalUrl,
          routePath: buildTscRoutePath(row.namespace, row.slug),
        }
      : null,
    updatedAt: new Date().toISOString(),
  };
}

export function buildNetworkPayload(
  personId: string,
  identities: TscIdentityRecord[],
  badges: TscVerificationBadgeEntry[],
): TscIdentityNetworkPayload {
  return {
    personId,
    identities,
    badges: dedupeBadges(badges),
    updatedAt: new Date().toISOString(),
  };
}

export function buildVerifyPayload(
  entityType: TscIdentityEntityTypeValue,
  entityId: string,
  row: TscIdentityRow,
): AdminIdentityVerifyPayload {
  return {
    entityType,
    entityId,
    identity: toTscIdentityRecord(row),
    badges: collectBadgesForIdentity(row),
  };
}

export function resolveBadgeForAdminInput(
  entityType: TscIdentityEntityTypeValue,
  input: AdminIdentityVerifyInput,
): TscVerificationBadgeValue {
  return input.badge ?? badgeForEntityType(entityType);
}

export function brandSlugFromName(name: string, brandId: string): string {
  return slugifyTscIdentity(name) || `brand-${brandId.slice(0, 8)}`;
}

export function venueSlugFromName(name: string, venueId: string): string {
  return slugifyTscIdentity(name) || `venue-${venueId.slice(0, 8)}`;
}

export type { TscIdentityNamespaceValue };
