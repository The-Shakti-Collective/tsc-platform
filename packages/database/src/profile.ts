import type { Prisma } from '@prisma/client';

export const VERIFICATION_LEVELS = [0, 1, 2, 3, 4] as const;
export type VerificationLevelValue = (typeof VERIFICATION_LEVELS)[number];

export const PROFILE_MODELS = ['PersonProfile', 'PersonVerificationRequest'] as const;

export const personProfileInclude = {
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
} satisfies Prisma.PersonProfileInclude;

export function profileSlugWhere(slug: string): Prisma.PersonProfileWhereInput {
  return {
    slug: { equals: slug, mode: 'insensitive' },
  };
}

export function profileUsernameWhere(
  username: string,
): Prisma.PersonProfileWhereInput {
  return {
    username: { equals: username, mode: 'insensitive' },
  };
}

export function slugifyProfileHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
