import type { Prisma } from '@prisma/client';

export const FOLLOWS_RELATIONSHIP = 'FOLLOWS';

export const personFollowInclude = {
  follower: {
    select: {
      id: true,
      displayName: true,
      name: true,
      profile: {
        select: {
          slug: true,
          username: true,
        },
      },
    },
  },
  following: {
    select: {
      id: true,
      displayName: true,
      name: true,
      profile: {
        select: {
          slug: true,
          username: true,
        },
      },
    },
  },
} satisfies Prisma.PersonFollowInclude;
