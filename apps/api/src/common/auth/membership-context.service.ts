import { Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import type { CommunityRole } from '@tsc/permissions';
import { IdentityRepository } from '../../modules/identity/identity.repository';
import { IdentityResolutionService } from '../../modules/identity/identity-resolution.service';
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
    private readonly identityResolution: IdentityResolutionService,
  ) {}

  async resolve(clerkUserId: string): Promise<MembershipContext> {
    await this.ensurePersonLinked(clerkUserId);

    const mapped = await this.profileRepository.findPersonByCoreKnotUser(clerkUserId);
    const personId = mapped?.personId;

    const artistMemberships: string[] = [];
    const organizationMemberships: string[] = [];
    let communityMemberships: MembershipContext['communityMemberships'] = [];

    if (personId) {
      const artist = await this.profileRepository.findArtistByPersonId(personId);
      if (artist?.id) artistMemberships.push(artist.id);

      const memberships = await this.identityRepository.listCommunityMemberships(personId);
      communityMemberships = memberships.map((row) => ({
        communityId: row.communityId,
        role: COMMUNITY_ROLE_MAP[row.role] ?? 'Member',
      }));
    }

    const roles = isPlatformAdmin(clerkUserId) ? ['admin'] : [];

    return {
      userId: clerkUserId,
      personId: personId ?? undefined,
      roles,
      artistMemberships,
      organizationMemberships,
      communityMemberships,
    };
  }

  private async ensurePersonLinked(clerkUserId: string): Promise<void> {
    const existing = await this.profileRepository.findPersonByCoreKnotUser(clerkUserId);
    if (existing?.personId) return;

    await this.identityResolution.resolve({
      identifiers: [{ provider: 'coreknot_user', externalId: clerkUserId, verified: true }],
      createIfMissing: true,
      source: 'clerk',
    });
  }
}
