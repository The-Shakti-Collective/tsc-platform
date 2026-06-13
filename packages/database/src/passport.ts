import type { Prisma } from '@prisma/client';

export const PASSPORT_CAREER_RELATIONSHIP_TYPES = [
  'PERFORMED_AT',
  'MEMBER_OF',
  'COLLABORATED_WITH',
] as const;

export type PassportCareerRelationshipType =
  (typeof PASSPORT_CAREER_RELATIONSHIP_TYPES)[number];

export const artistPassportInclude = {
  artist: {
    select: {
      id: true,
      slug: true,
      displayName: true,
      name: true,
      personId: true,
      bio: true,
      photoUrl: true,
      metadata: true,
    },
  },
} satisfies Prisma.ArtistPassportInclude;

export function passportPublicWhere(slug: string): Prisma.ArtistPassportWhereInput {
  return {
    slug: { equals: slug, mode: 'insensitive' },
    isPublic: true,
  };
}

export function passportSlugWhere(slug: string): Prisma.ArtistPassportWhereInput {
  return {
    slug: { equals: slug, mode: 'insensitive' },
  };
}
