import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { SOCIAL_IDENTIFIER_PROVIDERS } from '@tsc/database';
import type {
  VerificationBreakdown,
  VerificationPayload,
} from '@tsc/types';
import type { PersonProfileRow } from './profile.repository';
import { ProfileRepository } from './profile.repository';

const LEVEL_LABELS: Record<number, string> = {
  0: 'Unverified',
  1: 'Contact verified',
  2: 'Social connected',
  3: 'Community verified',
  4: 'TSC verified',
};

@Injectable()
export class VerificationService {
  constructor(private readonly repository: ProfileRepository) {}

  async computeVerificationLevel(personId: string): Promise<number> {
    const payload = await this.getVerification(personId);
    return payload.level;
  }

  async getVerification(personId: string): Promise<VerificationPayload> {
    const [identifiers, profile, communityLeader] = await Promise.all([
      this.repository.listIdentifiers(personId),
      this.repository.findByPersonId(personId),
      this.repository.hasCommunityLeadership(personId),
    ]);

    const emailVerified = identifiers.some(
      (row) => row.provider === 'email' && row.verified,
    );
    const phoneVerified = identifiers.some(
      (row) => row.provider === 'phone' && row.verified,
    );
    const socialConnected = identifiers.some((row) =>
      SOCIAL_IDENTIFIER_PROVIDERS.includes(
        row.provider as (typeof SOCIAL_IDENTIFIER_PROVIDERS)[number],
      ),
    );

    const breakdown: VerificationBreakdown[] = [
      {
        level: 0,
        label: LEVEL_LABELS[0],
        satisfied: true,
        detail: 'Default baseline',
      },
      {
        level: 1,
        label: LEVEL_LABELS[1],
        satisfied: emailVerified && phoneVerified,
        detail: 'Verified email and phone identifiers',
      },
      {
        level: 2,
        label: LEVEL_LABELS[2],
        satisfied: socialConnected,
        detail: 'Instagram, Spotify, or other social identifier linked',
      },
      {
        level: 3,
        label: LEVEL_LABELS[3],
        satisfied: communityLeader,
        detail: 'Community leader role or MANAGES relationship',
      },
      {
        level: 4,
        label: LEVEL_LABELS[4],
        satisfied: profile?.adminVerified === true,
        detail: 'TSC admin verification flag',
      },
    ];

    const maxComputedLevel = breakdown
      .filter((row) => row.satisfied)
      .reduce((max, row) => Math.max(max, row.level), 0);

    const level = Math.max(maxComputedLevel, profile?.verificationLevel ?? 0);

    if (profile && profile.verificationLevel !== level) {
      await this.repository
        .updateVerificationLevel(personId, level)
        .catch(() => undefined);
    }

    return {
      personId,
      level,
      maxComputedLevel,
      adminVerified: profile?.adminVerified ?? false,
      breakdown,
      updatedAt: new Date().toISOString(),
    };
  }

  async setAdminVerification(
    personId: string,
    level: 4,
  ): Promise<VerificationPayload> {
    await this.repository.createStub({ personId });
    await this.repository.updateVerificationLevel(personId, level, true);
    return this.getVerification(personId);
  }
}

export function parseProfileLinks(
  value: Prisma.JsonValue | undefined | null,
): Array<{ label: string; url: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { label: string; url: string } =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).label === 'string' &&
        typeof (item as Record<string, unknown>).url === 'string',
    )
    .map((item) => ({ label: item.label, url: item.url }));
}

export function buildProfileShareUrl(slug: string): string {
  const base = process.env.TSC_PUBLIC_URL ?? 'https://tsc.in';
  return `${base}/${slug}`;
}

export function toProfileRecord(
  profile: PersonProfileRow,
  roles: Awaited<ReturnType<ProfileRepository['listActiveRoles']>>,
): import('@tsc/types').PersonProfileRecord {
  const displayName =
    profile.person?.displayName ??
    profile.person?.name ??
    profile.username ??
    profile.slug;

  return {
    id: profile.id,
    personId: profile.personId,
    username: profile.username,
    slug: profile.slug,
    bio: profile.bio,
    city: profile.city,
    genres: profile.genres ?? [],
    skills: profile.skills ?? [],
    links: parseProfileLinks(profile.links),
    verificationLevel: profile.verificationLevel,
    reputationScore: profile.reputationScore,
    ecosystemScore: profile.ecosystemScore,
    displayName,
    roles: roles.map((row) => ({
      role: row.role,
      entityType: row.entityType,
      entityId: row.entityId,
      label: row.role.replace(/_/g, ' '),
    })),
    shareUrl: buildProfileShareUrl(profile.slug),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
