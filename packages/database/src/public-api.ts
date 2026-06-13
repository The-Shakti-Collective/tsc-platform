import type { Prisma } from '@prisma/client';

export const API_KEY_HEADER = 'x-tsc-api-key';

export const DEFAULT_API_RATE_LIMIT = 100;

export const API_SCOPES = [
  'read:artists',
  'read:communities',
  'read:opportunities',
  'read:events',
  'read:venues',
  'read:analytics',
  'read:identity',
  'read:export',
  'read:graph',
] as const;

export type ApiScopeValue = (typeof API_SCOPES)[number];

export const WHITE_LABEL_TENANT_TYPES = ['agency', 'community', 'festival'] as const;

export type WhiteLabelTenantTypeValue = (typeof WHITE_LABEL_TENANT_TYPES)[number];

export const apiKeyPublicSelect = {
  id: true,
  name: true,
  prefix: true,
  scopes: true,
  ownerOrgId: true,
  rateLimit: true,
  isActive: true,
  createdAt: true,
  lastUsedAt: true,
} satisfies Prisma.ApiKeySelect;

export function apiKeyListWhere(input: {
  ownerOrgId?: string;
  isActive?: boolean;
}): Prisma.ApiKeyWhereInput {
  const where: Prisma.ApiKeyWhereInput = {};
  if (input.ownerOrgId) where.ownerOrgId = input.ownerOrgId;
  if (input.isActive != null) where.isActive = input.isActive;
  return where;
}

export function publicArtistListWhere(input: {
  city?: string;
  genre?: string;
}): Prisma.ArtistWhereInput {
  const profileWhere: Prisma.PersonProfileWhereInput = {};
  if (input.city?.trim()) {
    profileWhere.city = { equals: input.city.trim(), mode: 'insensitive' };
  }
  if (input.genre?.trim()) {
    profileWhere.genres = { has: input.genre.trim().toLowerCase() };
  }
  if (Object.keys(profileWhere).length === 0) return {};
  return { person: { profile: profileWhere } };
}

export const publicArtistInclude = {
  person: {
    select: {
      profile: { select: { city: true, genres: true, slug: true } },
    },
  },
} satisfies Prisma.ArtistInclude;

export function whiteLabelTenantWhere(slug: string): Prisma.WhiteLabelTenantWhereInput {
  return { slug, isActive: true };
}

export const whiteLabelTenantInclude = {
  apiKey: { select: apiKeyPublicSelect },
} satisfies Prisma.WhiteLabelTenantInclude;

export interface WhiteLabelTenantConfig {
  agencyId?: string;
  communityId?: string;
  festivalEventIds?: string[];
  navItems?: Array<{ label: string; path: string }>;
  tagline?: string;
}

export function parseWhiteLabelConfig(value: unknown): WhiteLabelTenantConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const row = value as Record<string, unknown>;
  return {
    agencyId: typeof row.agencyId === 'string' ? row.agencyId : undefined,
    communityId: typeof row.communityId === 'string' ? row.communityId : undefined,
    festivalEventIds: Array.isArray(row.festivalEventIds)
      ? row.festivalEventIds.filter((item): item is string => typeof item === 'string')
      : undefined,
    navItems: Array.isArray(row.navItems)
      ? row.navItems
          .filter(
            (item): item is { label: string; path: string } =>
              !!item &&
              typeof item === 'object' &&
              typeof (item as { label?: unknown }).label === 'string' &&
              typeof (item as { path?: unknown }).path === 'string',
          )
          .map((item) => ({ label: item.label, path: item.path }))
      : undefined,
    tagline: typeof row.tagline === 'string' ? row.tagline : undefined,
  };
}
