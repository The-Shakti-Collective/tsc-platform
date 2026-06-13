import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  VERIFIED_ARTIST_LEVEL,
  VERIFIED_BRAND_TRUST_THRESHOLD,
  namespaceForEntityType,
  type TscIdentityEntityTypeValue,
  type TscIdentityNamespaceValue,
} from '@tsc/database';
import type { MembershipContext } from '@tsc/permissions';
import { isAdmin } from '@tsc/permissions';
import type {
  AdminIdentityVerifyInput,
  AdminIdentityVerifyPayload,
  TscIdentityNetworkPayload,
  TscIdentityPublicPayload,
  TscVerificationBadgesPayload,
} from '@tsc/types';
import {
  badgeEntry,
  buildBadgesPayload,
  buildNetworkPayload,
  buildPublicPayload,
  buildVerifyPayload,
  dedupeBadges,
  resolveBadgeForAdminInput,
  toTscIdentityRecord,
} from './tsc-identity.mapper';
import { TscIdentityProvisionService } from './tsc-identity-provision.service';
import { TscIdentityRepository } from './tsc-identity.repository';
import { WebhookEmitterService } from '../data-exchange/webhook-emitter.service';

@Injectable()
export class TscIdentityNetworkService {
  constructor(
    private readonly repository: TscIdentityRepository,
    private readonly provisionService: TscIdentityProvisionService,
    @Optional() private readonly webhookEmitter?: WebhookEmitterService,
  ) {}

  async getPublicIdentity(
    namespace: TscIdentityNamespaceValue,
    slug: string,
  ): Promise<TscIdentityPublicPayload> {
    this.assertAvailable();

    let row = await this.repository.findPublicByNamespaceSlug(namespace, slug);
    if (!row) {
      await this.backfillFromLegacySlug(namespace, slug);
      row = await this.repository.findPublicByNamespaceSlug(namespace, slug);
    }

    if (!row) {
      throw new NotFoundException(`TSC identity ${namespace}.tsc/${slug} not found`);
    }

    const displayName = await this.resolveDisplayName(row.entityType, row.entityId);
    const computed = await this.computeBadges(row.entityType, row.entityId, row);
    return buildPublicPayload(row, displayName, computed);
  }

  async getVerificationBadges(
    entityType: TscIdentityEntityTypeValue,
    entityId: string,
  ): Promise<TscVerificationBadgesPayload> {
    this.assertAvailable();

    const namespace = namespaceForEntityType(entityType);
    let row = await this.repository.findByEntity(namespace, entityId);
    if (!row) {
      await this.provisionForEntity(entityType, entityId);
      row = await this.repository.findByEntity(namespace, entityId);
    }

    const computed = await this.computeBadges(entityType, entityId, row);
    return buildBadgesPayload(entityType, entityId, row, computed);
  }

  async setAdminVerificationBadge(
    entityType: TscIdentityEntityTypeValue,
    entityId: string,
    input: AdminIdentityVerifyInput,
    ctx: MembershipContext,
  ): Promise<AdminIdentityVerifyPayload> {
    if (!isAdmin(ctx)) {
      throw new ForbiddenException('Admin access required');
    }

    this.assertAvailable();
    await this.provisionForEntity(entityType, entityId);

    const badge = resolveBadgeForAdminInput(entityType, input);
    const updated = await this.repository.setVerifiedBadge(
      entityType,
      entityId,
      badge,
      input.isPublic,
    );

    if (!updated) {
      throw new NotFoundException(
        `TSC identity for ${entityType} ${entityId} not provisioned`,
      );
    }

    if (entityType === 'Brand') {
      await this.repository.updateBrandVerified(entityId, true);
    }

    if (entityType === 'Person' || entityType === 'Artist') {
      const personId =
        entityType === 'Person'
          ? entityId
          : (await this.repository.findArtistById(entityId))?.personId;
      if (personId) {
        await this.repository.updatePersonAdminVerified(personId);
      }
    }

    this.webhookEmitter?.emit('identity.verified', {
      entityType,
      entityId,
      badge,
      isPublic: input.isPublic,
      namespace: updated.namespace,
      slug: updated.slug,
    });

    return buildVerifyPayload(entityType, entityId, updated);
  }

  async getPersonIdentityNetwork(personId: string): Promise<TscIdentityNetworkPayload> {
    this.assertAvailable();

    const [profile, artist, brands, leadership] = await Promise.all([
      this.repository.findPersonProfile(personId),
      this.repository.findArtistByPersonId(personId),
      this.repository.listBrandsForPerson(personId),
      this.repository.listCommunityLeadership(personId),
    ]);

    if (profile) {
      await this.provisionService.ensureFanIdentity(personId, profile.slug);
    }
    if (artist) {
      await this.provisionService.ensureArtistIdentity(artist.id, artist.slug);
    }
    for (const brand of brands) {
      await this.provisionService.ensureBrandIdentity(brand.id, brand.name);
    }
    for (const membership of leadership) {
      await this.provisionService.ensureCommunityIdentity(
        membership.community.id,
        membership.community.slug,
      );
    }

    const entityRefs: Array<{ type: TscIdentityEntityTypeValue; id: string }> = [
      { type: 'Person', id: personId },
    ];
    if (artist) entityRefs.push({ type: 'Artist', id: artist.id });
    for (const brand of brands) entityRefs.push({ type: 'Brand', id: brand.id });
    for (const membership of leadership) {
      entityRefs.push({ type: 'Community', id: membership.community.id });
    }

    const identityRows = (
      await Promise.all(
        entityRefs.map(({ type, id }) => this.repository.listByEntity(type, id)),
      )
    ).flat();

    const identities = identityRows.map(toTscIdentityRecord);
    const badgeGroups = await Promise.all(
      entityRefs.map(({ type, id }) => {
        const row =
          identityRows.find((entry) => entry.entityType === type && entry.entityId === id) ??
          null;
        return this.computeBadges(type, id, row);
      }),
    );

    return buildNetworkPayload(personId, identities, dedupeBadges(badgeGroups.flat()));
  }

  private async backfillFromLegacySlug(
    namespace: TscIdentityNamespaceValue,
    slug: string,
  ): Promise<void> {
    switch (namespace) {
      case 'artist': {
        const artist = await this.repository.findArtistBySlug(slug);
        if (artist) {
          await this.provisionService.ensureArtistIdentity(artist.id, artist.slug);
        }
        break;
      }
      case 'fan': {
        const profile = await this.repository.findProfileBySlug(slug);
        if (profile) {
          await this.provisionService.ensureFanIdentity(profile.personId, profile.slug);
        }
        break;
      }
      case 'community': {
        const community = await this.repository.findCommunityBySlug(slug);
        if (community) {
          await this.provisionService.ensureCommunityIdentity(community.id, community.slug);
        }
        break;
      }
      case 'brand': {
        const brand = await this.repository.findBrandById(slug);
        if (brand) {
          await this.provisionService.ensureBrandIdentity(brand.id, brand.name);
        }
        break;
      }
      default:
        break;
    }
  }

  private async provisionForEntity(
    entityType: TscIdentityEntityTypeValue,
    entityId: string,
  ): Promise<void> {
    switch (entityType) {
      case 'Artist': {
        const artist = await this.repository.findArtistById(entityId);
        if (artist) await this.provisionService.ensureArtistIdentity(artist.id, artist.slug);
        break;
      }
      case 'Community': {
        await this.provisionService.ensureCommunityById(entityId);
        break;
      }
      case 'Brand': {
        const brand = await this.repository.findBrandById(entityId);
        if (brand) await this.provisionService.ensureBrandIdentity(brand.id, brand.name);
        break;
      }
      case 'Person': {
        const profile = await this.repository.findPersonProfile(entityId);
        if (profile) {
          await this.provisionService.ensureFanIdentity(profile.personId, profile.slug);
        }
        break;
      }
      case 'Venue': {
        const venue = await this.repository.findVenueById(entityId);
        if (venue) await this.provisionService.ensureVenueIdentity(venue.id, venue.name);
        break;
      }
      default:
        break;
    }
  }

  private async computeBadges(
    entityType: TscIdentityEntityTypeValue,
    entityId: string,
    row: Awaited<ReturnType<TscIdentityRepository['findByEntity']>>,
  ) {
    const computed: ReturnType<typeof badgeEntry>[] = [];

    if (entityType === 'Brand') {
      const brand = await this.repository.findBrandById(entityId);
      if (brand?.verified) {
        computed.push(
          badgeEntry('verified_brand_partner', 'computed', new Date().toISOString()),
        );
      }
    }

    if (entityType === 'Artist') {
      const artist = await this.repository.findArtistById(entityId);
      if (artist?.personId) {
        const profile = await this.repository.findPersonProfile(artist.personId);
        if ((profile?.verificationLevel ?? 0) >= VERIFIED_ARTIST_LEVEL || profile?.adminVerified) {
          computed.push(badgeEntry('verified_artist', 'computed', new Date().toISOString()));
        }
      }
    }

    if (row?.verifiedBadge && !computed.some((entry) => entry.badge === row.verifiedBadge)) {
      // admin badge merged via collectBadgesForIdentity in response builders
    }

    void VERIFIED_BRAND_TRUST_THRESHOLD;
    return computed;
  }

  private async resolveDisplayName(
    entityType: TscIdentityEntityTypeValue,
    entityId: string,
  ): Promise<string | null> {
    switch (entityType) {
      case 'Artist': {
        const artist = await this.repository.findArtistById(entityId);
        return artist?.displayName ?? artist?.name ?? null;
      }
      case 'Community': {
        const community = await this.repository.findCommunityById(entityId);
        return community?.name ?? null;
      }
      case 'Brand': {
        const brand = await this.repository.findBrandById(entityId);
        return brand?.name ?? null;
      }
      case 'Person': {
        const profile = await this.repository.findPersonProfile(entityId);
        return profile?.slug ?? null;
      }
      case 'Venue': {
        const venue = await this.repository.findVenueById(entityId);
        return venue?.name ?? null;
      }
      default:
        return null;
    }
  }

  private assertAvailable(): void {
    if (!this.repository.isAvailable()) {
      throw new BadRequestException('TscIdentity model unavailable — run Phase 10.1 migration');
    }
  }
}
