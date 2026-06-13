import { Injectable, Logger } from '@nestjs/common';
import { namespaceForEntityType, type TscIdentityEntityTypeValue } from '@tsc/database';
import { TscIdentityRepository } from './tsc-identity.repository';
import { brandSlugFromName, venueSlugFromName } from './tsc-identity.mapper';

@Injectable()
export class TscIdentityProvisionService {
  private readonly logger = new Logger(TscIdentityProvisionService.name);

  constructor(private readonly repository: TscIdentityRepository) {}

  async ensureArtistIdentity(
    artistId: string,
    slug: string,
    isPublic = true,
  ): Promise<void> {
    await this.ensure('Artist', artistId, slug, isPublic);
  }

  async ensureCommunityIdentity(
    communityId: string,
    slug: string,
    isPublic = true,
  ): Promise<void> {
    await this.ensure('Community', communityId, slug, isPublic);
  }

  async ensureBrandIdentity(
    brandId: string,
    name: string,
    isPublic = true,
  ): Promise<void> {
    await this.ensure('Brand', brandId, brandSlugFromName(name, brandId), isPublic);
  }

  async ensureFanIdentity(
    personId: string,
    slug: string,
    isPublic = true,
  ): Promise<void> {
    await this.ensure('Person', personId, slug, isPublic);
  }

  /** Phase 13 — align fan TSC identity slug with CreativeIdentity canonical handle */
  async ensureCreativeIdentity(
    personId: string,
    creativeSlug: string,
    isPublic = true,
  ): Promise<void> {
    await this.ensureFanIdentity(personId, creativeSlug, isPublic);
  }

  async ensureVenueIdentity(
    venueId: string,
    name: string,
    isPublic = true,
  ): Promise<void> {
    await this.ensure('Venue', venueId, venueSlugFromName(name, venueId), isPublic);
  }

  /** Lazy backfill when community is loaded. */
  async ensureCommunityById(communityId: string): Promise<void> {
    const community = await this.repository.findCommunityById(communityId);
    if (!community) return;
    await this.ensureCommunityIdentity(community.id, community.slug);
  }

  private async ensure(
    entityType: TscIdentityEntityTypeValue,
    entityId: string,
    slug: string,
    isPublic: boolean,
  ): Promise<void> {
    if (!this.repository.isAvailable()) return;

    try {
      await this.repository.ensureIdentity({ entityType, entityId, slug, isPublic });
    } catch (error) {
      this.logger.warn(
        `[tsc-identity] provision failed ${namespaceForEntityType(entityType)}/${slug}: ${String(error)}`,
      );
    }
  }
}
