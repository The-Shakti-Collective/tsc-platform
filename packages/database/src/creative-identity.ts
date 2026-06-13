import type { Prisma } from '@prisma/client';

export const CREATIVE_VERTICALS = [
  'music',
  'film',
  'photography',
  'podcast',
  'comedy',
  'dance',
  'content',
] as const;

export type CreativeVerticalValue = (typeof CREATIVE_VERTICALS)[number];

export const CREATIVE_ROLE_TAGS = [
  'photographer',
  'videographer',
  'artist',
  'producer',
  'manager',
  'founder',
  'community_leader',
] as const;

export type CreativeRoleTagValue = (typeof CREATIVE_ROLE_TAGS)[number];

export const CREATIVE_IDENTITY_MODELS = ['CreativeIdentity'] as const;

export const CREATIVE_IDENTITY_ROUTE_PREFIXES = {
  creator: '/creator',
  creative: '/creative',
} as const;

export const creativeIdentityInclude = {
  person: {
    select: {
      id: true,
      name: true,
      displayName: true,
      profile: {
        select: {
          slug: true,
          username: true,
          bio: true,
          city: true,
          verificationLevel: true,
          ecosystemScore: true,
          reputationScore: true,
        },
      },
    },
  },
} satisfies Prisma.CreativeIdentityInclude;

export function creativeIdentitySlugWhere(slug: string): Prisma.CreativeIdentityWhereInput {
  return {
    slug: { equals: slug, mode: 'insensitive' },
    isPublic: true,
  };
}

export function creativeIdentityPersonWhere(personId: string): Prisma.CreativeIdentityWhereInput {
  return { personId };
}

export function slugifyCreativeHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildCreativeShareUrl(slug: string): string {
  const base = (process.env.TSC_PUBLIC_URL ?? 'https://tsc.in').replace(/\/$/, '');
  return `${base}/creator/${slug}`;
}

export function buildCreativeRoutePath(slug: string, variant: 'creator' | 'creative' = 'creator'): string {
  const prefix = CREATIVE_IDENTITY_ROUTE_PREFIXES[variant];
  return `${prefix}/${slug}`;
}

export function isCreativeVertical(value: string): value is CreativeVerticalValue {
  return (CREATIVE_VERTICALS as readonly string[]).includes(value);
}

export function isCreativeRoleTag(value: string): value is CreativeRoleTagValue {
  return (CREATIVE_ROLE_TAGS as readonly string[]).includes(value);
}

export function filterCreativeVerticals(values: string[]): CreativeVerticalValue[] {
  return values.filter(isCreativeVertical);
}

export function filterCreativeRoleTags(values: string[]): CreativeRoleTagValue[] {
  return values.filter(isCreativeRoleTag);
}
