import { Injectable } from '@nestjs/common';
import type { MembershipContext, OrganizationMembership, PlatformRole } from '@tsc/permissions';
import type { CommunityRole } from '@tsc/permissions';
import { PrismaService } from '../database/prisma.service';
import { IdentityRepository } from '../../modules/identity/identity.repository';
import { ProfileRepository } from '../../modules/profile/profile.repository';
import { isPlatformAdmin } from './clerk-config';

const COMMUNITY_ROLE_MAP: Record<string, CommunityRole> = {
  Founder: 'Founder',
  Admin: 'Admin',
  Moderator: 'Moderator',
  Contributor: 'Contributor',
  Member: 'Member',
};

@Injectable()
export class MembershipContextService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly identityRepository: IdentityRepository,
    private readonly prisma: PrismaService,
  ) {}

  async resolve(clerkUserId: string): Promise<MembershipContext> {
    const userAccount = await this.prisma.client.user.findUnique({
      where: { clerkUserId },
      select: { personId: true },
    });

    return this.buildMembershipContext({
      userId: clerkUserId,
      personId: userAccount?.personId,
      adminUserId: clerkUserId,
    });
  }

  /** Dual-auth bridge — legacy Mongo User._id from session JWT `id` claim. */
  async resolveFromLegacyMongoUserId(mongoUserId: string): Promise<MembershipContext> {
    const mapped = await this.profileRepository.findPersonByCoreKnotUser(mongoUserId);
    let personId = mapped?.personId ?? null;

    if (!personId) {
      const syncRow = await this.prisma.client.syncMapping.findFirst({
        where: {
          sourceSystem: 'coreknot',
          externalId: mongoUserId,
          tscEntityType: { in: ['Person', 'User'] },
        },
        select: { tscEntityId: true },
      });
      personId = syncRow?.tscEntityId ?? null;
    }

    return this.buildMembershipContext({
      userId: mongoUserId,
      personId,
    });
  }

  private async buildMembershipContext(input: {
    userId: string;
    personId: string | null | undefined;
    adminUserId?: string;
  }): Promise<MembershipContext> {
    const personId = input.personId ?? undefined;
    const artistMemberships: string[] = [];
    let organizationMemberships: OrganizationMembership[] = [];
    let communityMemberships: MembershipContext['communityMemberships'] = [];
    let platformRole: PlatformRole | undefined;

    if (personId) {
      const artist = await this.profileRepository.findArtistByPersonId(personId);
      if (artist?.id) artistMemberships.push(artist.id);

      const memberships = await this.identityRepository.listCommunityMemberships(personId);
      communityMemberships = memberships.map((row) => ({
        communityId: row.communityId,
        role: COMMUNITY_ROLE_MAP[row.role] ?? 'Member',
      }));

      const userAccount = await this.prisma.client.user.findUnique({
        where: { personId },
        select: { platformRole: true },
      });
      platformRole = userAccount?.platformRole as PlatformRole | undefined;

      const orgRows = await this.prisma.client.organizationMember.findMany({
        where: { personId, status: 'active' },
        select: { organizationId: true, role: true },
      });
      organizationMemberships = orgRows.map((row) => ({
        organizationId: row.organizationId,
        role: row.role as PlatformRole,
      }));
    }

    const adminUserId = input.adminUserId ?? input.userId;
    const roles = isPlatformAdmin(adminUserId) ? ['admin'] : [];

    return {
      userId: input.userId,
      personId,
      roles,
      platformRole,
      artistMemberships,
      organizationMemberships,
      communityMemberships,
    };
  }
}
