/** Phase 8 Step 1 — Universal Fan Identity helpers. */

import type { Prisma } from '@prisma/client';

export const FAN_PROFILE_MODELS = ['FanProfile', 'ArtistFollow'] as const;

export type FanProfileModel = (typeof FAN_PROFILE_MODELS)[number];

/** Fan-centric graph relationship types (Phase 8). */
export const FAN_GRAPH_RELATIONSHIP_TYPES = [
  'FOLLOWS',
  'ATTENDED',
  'MEMBER_OF',
  'SUPPORTED',
  'SUBSCRIBED',
  'PURCHASED',
  'REFERRED',
] as const;

export type FanGraphRelationshipType = (typeof FAN_GRAPH_RELATIONSHIP_TYPES)[number];

export const fanProfileInclude = {
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
          genres: true,
        },
      },
    },
  },
} satisfies Prisma.FanProfileInclude;

export function fanProfileWhere(personId: string): Prisma.FanProfileWhereInput {
  return { personId };
}

export function clampFanScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

/** Stub scores from participation counts when FanIntelligenceSnapshot missing. */
export function stubFanScoresFromParticipation(input: {
  registeredCount: number;
  checkedInCount: number;
  communityCount: number;
  artistFollowCount: number;
}) {
  const attendanceScore = clampFanScore(
    input.checkedInCount * 12 + input.registeredCount * 4,
  );
  const engagementScore = clampFanScore(
    input.communityCount * 10 + input.artistFollowCount * 8 + input.registeredCount * 3,
  );
  const spendScore = 0;
  const influenceScore = clampFanScore(input.artistFollowCount * 5);

  return {
    engagementScore,
    spendScore,
    attendanceScore,
    influenceScore,
  };
}
