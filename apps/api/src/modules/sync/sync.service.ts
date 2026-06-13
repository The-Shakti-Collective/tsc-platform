import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  CoreKnotPipelineUpdate,
  SyncEventEnvelope,
  SyncEventResult,
  SyncEventsResponse,
} from '@tsc/contracts/sync';
import type { SyncSourceSystemValue } from '@tsc/database';
import { IdentityResolutionService } from '../identity/identity-resolution.service';
import { AutomationService } from '../intelligence/automation.service';
import { BookingService } from '../booking/booking.service';
import { ProfileService } from '../profile/profile.service';
import { TscIdentityProvisionService } from '../tsc-identity/tsc-identity-provision.service';
import { CreativeIdentityService } from '../creative-identity/creative-identity.service';
import { SyncRepository } from './sync.repository';
import type { SyncEventsRequestInput } from './dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly syncRepository: SyncRepository,
    private readonly automationService: AutomationService,
    private readonly bookingService: BookingService,
    private readonly identityResolution: IdentityResolutionService,
    private readonly profileService: ProfileService,
    private readonly tscIdentityProvision: TscIdentityProvisionService,
    private readonly creativeIdentityService: CreativeIdentityService,
  ) {}

  async ingestEvents(input: SyncEventsRequestInput): Promise<SyncEventsResponse> {
    const results: SyncEventResult[] = [];

    for (const event of input.events) {
      results.push(await this.processEvent(event));
    }

    return {
      processed: results.filter((r) => r.status === 'processed').length,
      duplicates: results.filter((r) => r.status === 'duplicate').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    };
  }

  async getMapping(
    sourceSystem: SyncSourceSystemValue,
    externalId: string,
    tscEntityType?: string,
  ) {
    if (tscEntityType) {
      return this.syncRepository.findMapping({ sourceSystem, externalId, tscEntityType });
    }
    return this.syncRepository.listMappingsForExternal({ sourceSystem, externalId });
  }

  private async processEvent(event: SyncEventEnvelope): Promise<SyncEventResult> {
    const existing = await this.syncRepository.findEventReceipt(
      event.sourceSystem,
      event.externalId,
    );

    if (existing) {
      return {
        externalId: event.externalId,
        eventType: event.eventType,
        status: 'duplicate',
        message: 'Event already processed (idempotent replay)',
        tscEntityIds: (existing.result as Record<string, string> | null) ?? undefined,
      };
    }

    try {
      const result = await this.dispatch(event);
      await this.syncRepository.createEventReceipt({
        sourceSystem: event.sourceSystem,
        externalId: event.externalId,
        eventType: event.eventType,
        status: 'processed',
        result: {
          ...(result.tscEntityIds ?? {}),
          automationRunId: result.automationRunId,
        },
      });
      return { ...result, status: 'processed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync handler failed';
      this.logger.error(`Sync failed ${event.eventType} ${event.externalId}: ${message}`);

      await this.syncRepository.createEventReceipt({
        sourceSystem: event.sourceSystem,
        externalId: event.externalId,
        eventType: event.eventType,
        status: 'failed',
        result: { error: message },
      });

      return {
        externalId: event.externalId,
        eventType: event.eventType,
        status: 'failed',
        error: message,
      };
    }
  }

  private async dispatch(event: SyncEventEnvelope): Promise<Omit<SyncEventResult, 'status'>> {
    switch (event.eventType) {
      case 'artist.created':
        return this.handleArtistCreated(event);
      case 'artist.updated':
        return this.handleArtistUpdated(event);
      case 'opportunity.applied':
        return this.handleOpportunityApplied(event);
      case 'booking.inquiry':
        return this.handleBookingInquiry(event);
      case 'community.member.added':
        return this.handleCommunityMemberAdded(event);
      case 'brand.created':
        return this.handleBrandCreated(event);
      case 'deal.status_changed':
        return this.handleDealStatusChanged(event);
      default:
        throw new BadRequestException(`Unsupported event type`);
    }
  }

  private async handleArtistCreated(
    event: Extract<SyncEventEnvelope, { eventType: 'artist.created' }>,
  ): Promise<Omit<SyncEventResult, 'status'>> {
    const { data } = event;
    const artistExternalId = event.entityExternalId ?? event.externalId;

    const existingArtist = await this.syncRepository.resolveTscId(
      event.sourceSystem,
      artistExternalId,
      'Artist',
    );
    if (existingArtist) {
      return {
        externalId: event.externalId,
        eventType: event.eventType,
        message: 'Artist mapping already exists',
        tscEntityIds: { artistId: existingArtist.tscEntityId },
        mappings: [
          {
            sourceSystem: event.sourceSystem,
            externalId: artistExternalId,
            tscEntityType: 'Artist',
            tscEntityId: existingArtist.tscEntityId,
          },
        ],
      };
    }

    const resolved = await this.identityResolution.resolve({
      identifiers: this.buildArtistIdentityIdentifiers(data, artistExternalId),
      displayName: data.name,
      createIfMissing: true,
      source: 'coreknot_sync',
    });
    const personId = resolved.personId;

    const slug =
      data.slug ??
      (this.syncRepository.slugify(data.name) || `artist-${personId.slice(0, 8)}`);

    const artist = await this.syncRepository.createArtist({
      personId,
      name: data.name,
      slug,
      metadata: {
        source: 'coreknot_sync',
        coreknotArtistId: artistExternalId,
        links: data.links,
        ...(data.metadata ?? {}),
      },
    });

    const passport = await this.syncRepository.createPassportStub({
      artistId: artist.id,
      slug,
      bio: data.bio ?? null,
      links: data.links,
    });

    const profile = await this.profileService.ensureProfileStub({
      personId,
      slug,
      displayName: data.name,
    });

    void this.creativeIdentityService.syncArtistCreated(personId, artist.id, profile?.slug ?? slug);

    void this.tscIdentityProvision.ensureArtistIdentity(artist.id, slug, true);

    const mappings = [
      await this.syncRepository.upsertMapping({
        sourceSystem: event.sourceSystem,
        externalId: artistExternalId,
        tscEntityType: 'Artist',
        tscEntityId: artist.id,
        eventType: event.eventType,
      }),
      await this.syncRepository.upsertMapping({
        sourceSystem: event.sourceSystem,
        externalId: `${artistExternalId}:person`,
        tscEntityType: 'Person',
        tscEntityId: personId,
        eventType: event.eventType,
      }),
    ];

    await this.identityResolution.resolve({
      identifiers: [
        { provider: 'coreknot_user', externalId: artistExternalId },
      ],
      roles: [{ role: 'artist', entityType: 'Artist', entityId: artist.id }],
      createIfMissing: false,
      source: 'coreknot_sync',
    });

    if (data.managerPersonId) {
      await this.syncRepository.createRelationship({
        fromType: 'Person',
        fromId: data.managerPersonId,
        toType: 'Artist',
        toId: artist.id,
        relationshipType: 'MANAGES',
        metadata: { source: 'coreknot_sync' },
      });
    } else if (data.managerExternalId) {
      const manager = await this.syncRepository.resolveTscId(
        event.sourceSystem,
        data.managerExternalId,
        'Person',
      );
      if (manager) {
        await this.syncRepository.createRelationship({
          fromType: 'Person',
          fromId: manager.tscEntityId,
          toType: 'Artist',
          toId: artist.id,
          relationshipType: 'MANAGES',
          metadata: { source: 'coreknot_sync' },
        });
      }
    }

    return {
      externalId: event.externalId,
      eventType: event.eventType,
      message: 'Person, Artist, passport, and profile stubs created',
      tscEntityIds: {
        personId,
        artistId: artist.id,
        passportId: passport?.id,
        profileId: profile?.id,
      },
      mappings: mappings.map((m) => ({
        sourceSystem: m.sourceSystem,
        externalId: m.externalId,
        tscEntityType: m.tscEntityType,
        tscEntityId: m.tscEntityId,
      })),
    };
  }

  private async handleArtistUpdated(
    event: Extract<SyncEventEnvelope, { eventType: 'artist.updated' }>,
  ): Promise<Omit<SyncEventResult, 'status'>> {
    const artistExternalId = event.entityExternalId;
    if (!artistExternalId) {
      throw new BadRequestException('entityExternalId required for artist.updated');
    }

    const mapping = await this.syncRepository.resolveTscId(
      event.sourceSystem,
      artistExternalId,
      'Artist',
    );
    if (!mapping) {
      throw new NotFoundException(`No TSC artist mapping for ${artistExternalId}`);
    }

    const { data } = event;
    const artist = await this.syncRepository.updateArtist(mapping.tscEntityId, {
      name: data.name,
      slug: data.slug,
      metadata: data.metadata,
    });

    const personMapping = await this.syncRepository.resolveTscId(
      event.sourceSystem,
      `${artistExternalId}:person`,
      'Person',
    );

    if (personMapping && (data.name || data.email || data.phone)) {
      await this.syncRepository.updatePerson(personMapping.tscEntityId, {
        displayName: data.name,
        email: data.email,
        phone: data.phone,
      });
    }

    if (data.bio || data.links) {
      await this.syncRepository.createPassportStub({
        artistId: artist.id,
        slug: artist.slug,
        bio: data.bio ?? null,
        links: data.links,
      });
    }

    return {
      externalId: event.externalId,
      eventType: event.eventType,
      message: 'Artist updated from CoreKnot',
      tscEntityIds: {
        artistId: artist.id,
        personId: personMapping?.tscEntityId,
      },
    };
  }

  private async handleOpportunityApplied(
    event: Extract<SyncEventEnvelope, { eventType: 'opportunity.applied' }>,
  ): Promise<Omit<SyncEventResult, 'status'>> {
    const { data } = event;

    const artistId = await this.resolveArtistId(event.sourceSystem, data);
    const personId = await this.resolvePersonId(event.sourceSystem, data, artistId);

    let opportunityId = data.opportunityId ?? null;
    if (!opportunityId && data.opportunityExternalId) {
      const oppMapping = await this.syncRepository.resolveTscId(
        event.sourceSystem,
        data.opportunityExternalId,
        'Opportunity',
      );
      opportunityId = oppMapping?.tscEntityId ?? null;
    }

    if (!opportunityId) {
      const title = data.opportunityTitle ?? 'CoreKnot opportunity application';
      const opportunity = await this.syncRepository.createOpportunity({
        title,
        source: 'coreknot_sync',
        artistId,
        metadata: {
          coreknotOpportunityExternalId: data.opportunityExternalId,
          category: data.category,
          ...(data.metadata ?? {}),
        },
      });
      opportunityId = opportunity.id;

      if (data.opportunityExternalId) {
        await this.syncRepository.upsertMapping({
          sourceSystem: event.sourceSystem,
          externalId: data.opportunityExternalId,
          tscEntityType: 'Opportunity',
          tscEntityId: opportunity.id,
          eventType: event.eventType,
        });
      }
    }

    const application = await this.syncRepository.upsertOpportunityApplication({
      opportunityId,
      personId,
      artistId,
      notes: data.notes ?? null,
      appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
      metadata: data.metadata,
    });

    await this.syncRepository.createOpportunityActivity({
      opportunityId,
      type: 'application',
      summary: 'Application synced from CoreKnot',
      actorId: personId,
      metadata: {
        applicationId: application.id,
        source: 'coreknot_sync',
        eventExternalId: event.externalId,
      },
    });

    return {
      externalId: event.externalId,
      eventType: event.eventType,
      message: 'Opportunity application and CRM activity recorded',
      tscEntityIds: {
        opportunityId,
        applicationId: application.id,
        personId,
        artistId: artistId ?? undefined,
      },
    };
  }

  private async handleBookingInquiry(
    event: Extract<SyncEventEnvelope, { eventType: 'booking.inquiry' }>,
  ): Promise<Omit<SyncEventResult, 'status'>> {
    const { data } = event;
    const artistId = await this.resolveArtistId(event.sourceSystem, data);
    const personId = await this.resolvePersonId(event.sourceSystem, data, artistId);

    const automation = await this.automationService.trigger({
      workflowType: 'booking_inquiry',
      payload: {
        title: data.title,
        budget: data.budget ?? data.value,
        value: data.value ?? data.budget,
        venue: data.venue,
        city: data.city,
        eventDate: data.eventDate,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        notes: data.notes,
        assigneeExternalId: data.assigneeExternalId,
        coreknotEventId: event.externalId,
        ...(data.metadata ?? {}),
      },
      artistId: artistId ?? undefined,
      personId: personId ?? undefined,
    });

    const opportunityId =
      (automation.run.result?.opportunityId as string | undefined) ??
      automation.run.opportunityId ??
      undefined;

    const quotedValue =
      (automation.run.result?.quotedValue as number | undefined) ??
      data.budget ??
      data.value;

    let bookingRequestId: string | undefined;
    if (artistId && personId) {
      const persisted = await this.bookingService.upsertFromSync({
        requesterPersonId: personId,
        artistId,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        budget: quotedValue ?? data.budget ?? data.value ?? null,
        message: data.notes ?? data.title ?? null,
        opportunityId: opportunityId ?? null,
        externalId: event.externalId,
      });
      bookingRequestId = persisted?.id;
    }

    const pipelineUpdate: CoreKnotPipelineUpdate = {
      pipelineStage: 'inquiry_automation_complete',
      opportunityId,
      automationRunId: automation.run.id,
      quotedValue,
      assigneeExternalId: data.assigneeExternalId,
      summary: `Booking inquiry automation completed${opportunityId ? ` — opportunity ${opportunityId}` : ''}`,
      metadata: {
        workflowType: 'booking_inquiry',
        stubbed: automation.stubbed,
        artistId,
        personId,
        bookingRequestId,
      },
    };

    return {
      externalId: event.externalId,
      eventType: event.eventType,
      message: 'Booking inquiry automation triggered',
      automationRunId: automation.run.id,
      tscEntityIds: {
        opportunityId,
        artistId: artistId ?? undefined,
        personId: personId ?? undefined,
        bookingRequestId,
      },
      coreKnotPipelineUpdate: pipelineUpdate,
    };
  }

  private async handleCommunityMemberAdded(
    event: Extract<SyncEventEnvelope, { eventType: 'community.member.added' }>,
  ): Promise<Omit<SyncEventResult, 'status'>> {
    const { data } = event;

    let communityId = data.communityId ?? null;
    if (!communityId && data.communityExternalId) {
      const communityMapping = await this.syncRepository.resolveTscId(
        event.sourceSystem,
        data.communityExternalId,
        'Community',
      );
      communityId = communityMapping?.tscEntityId ?? null;
    }
    if (!communityId) {
      throw new BadRequestException('communityId or mapped communityExternalId required');
    }

    const community = await this.syncRepository.findCommunity(communityId);
    if (!community) {
      throw new NotFoundException(`Community ${communityId} not found`);
    }

    let personId = data.personId ?? null;
    if (!personId && data.personExternalId) {
      const personMapping = await this.syncRepository.resolveTscId(
        event.sourceSystem,
        data.personExternalId,
        'Person',
      );
      personId = personMapping?.tscEntityId ?? null;
    }

    if (!personId) {
      const person = await this.syncRepository.createPerson({
        displayName: data.displayName ?? 'Community member',
        email: data.email ?? null,
        metadata: {
          source: 'coreknot_sync',
          personExternalId: data.personExternalId,
          ...(data.metadata ?? {}),
        },
      });
      personId = person.id;

      if (data.personExternalId) {
        await this.syncRepository.upsertMapping({
          sourceSystem: event.sourceSystem,
          externalId: data.personExternalId,
          tscEntityType: 'Person',
          tscEntityId: person.id,
          eventType: event.eventType,
        });
      }
    }

    await this.syncRepository.ensureCommunityMember(
      communityId,
      personId,
      data.role,
    );

    await this.syncRepository.createRelationship({
      fromType: 'Person',
      fromId: personId,
      toType: 'Community',
      toId: communityId,
      relationshipType: 'MEMBER_OF',
      metadata: { source: 'coreknot_sync', role: data.role },
    });

    return {
      externalId: event.externalId,
      eventType: event.eventType,
      message: 'Community member linked',
      tscEntityIds: {
        communityId,
        personId,
      },
    };
  }

  private async handleBrandCreated(
    event: Extract<SyncEventEnvelope, { eventType: 'brand.created' }>,
  ): Promise<Omit<SyncEventResult, 'status'>> {
    const brandExternalId = event.entityExternalId ?? event.externalId;
    const { data } = event;

    const existing = await this.syncRepository.resolveTscId(
      event.sourceSystem,
      brandExternalId,
      'Brand',
    );
    if (existing) {
      return {
        externalId: event.externalId,
        eventType: event.eventType,
        message: 'Brand mapping already exists',
        tscEntityIds: { brandId: existing.tscEntityId },
      };
    }

    let personId: string | null = data.personId ?? null;
    if (!personId && data.personExternalId) {
      const personMapping = await this.syncRepository.resolveTscId(
        event.sourceSystem,
        data.personExternalId,
        'Person',
      );
      personId = personMapping?.tscEntityId ?? null;
    }

    const brand = await this.syncRepository.createBrand({
      name: data.name,
      industry: data.industry ?? null,
      city: data.city ?? null,
      country: data.country ?? null,
      website: data.website ?? null,
      personId,
    });

    if (!brand) {
      throw new BadRequestException('Brand model not migrated — run Phase 7 migration');
    }

    const mapping = await this.syncRepository.upsertMapping({
      sourceSystem: event.sourceSystem,
      externalId: brandExternalId,
      tscEntityType: 'Brand',
      tscEntityId: brand.id,
      eventType: event.eventType,
    });

    return {
      externalId: event.externalId,
      eventType: event.eventType,
      message: 'Brand stub created from sync event',
      tscEntityIds: { brandId: brand.id, personId: personId ?? undefined },
      mappings: [
        {
          sourceSystem: mapping.sourceSystem,
          externalId: mapping.externalId,
          tscEntityType: mapping.tscEntityType,
          tscEntityId: mapping.tscEntityId,
        },
      ],
    };
  }

  /** Outbound deal events may replay inbound — CRM update stub (Month 3). */
  private async handleDealStatusChanged(
    event: Extract<SyncEventEnvelope, { eventType: 'deal.status_changed' }>,
  ): Promise<Omit<SyncEventResult, 'status'>> {
    const { data } = event;
    return {
      externalId: event.externalId,
      eventType: event.eventType,
      message: 'Deal status change acknowledged — CoreKnot CRM update stub',
      tscEntityIds: {
        dealId: data.dealId,
        artistId: data.artistId,
        brandId: data.brandId,
      },
    };
  }

  private async resolveArtistId(
    sourceSystem: SyncSourceSystemValue,
    data: {
      artistId?: string;
      artistExternalId?: string;
    },
  ): Promise<string | null> {
    if (data.artistId) return data.artistId;
    if (!data.artistExternalId) return null;

    const mapping = await this.syncRepository.resolveTscId(
      sourceSystem,
      data.artistExternalId,
      'Artist',
    );
    return mapping?.tscEntityId ?? null;
  }

  private buildArtistIdentityIdentifiers(
    data: {
      email?: string;
      phone?: string;
      links?: Record<string, string>;
    },
    artistExternalId: string,
  ) {
    const identifiers: Array<{
      provider:
        | 'email'
        | 'phone'
        | 'instagram'
        | 'spotify'
        | 'coreknot_user';
      externalId: string;
      verified?: boolean;
    }> = [];

    if (data.email) {
      identifiers.push({ provider: 'email', externalId: data.email });
    }
    if (data.phone) {
      identifiers.push({ provider: 'phone', externalId: data.phone });
    }
    if (data.links?.instagram) {
      identifiers.push({
        provider: 'instagram',
        externalId: data.links.instagram,
      });
    }
    if (data.links?.spotify) {
      identifiers.push({ provider: 'spotify', externalId: data.links.spotify });
    }
    identifiers.push({
      provider: 'coreknot_user',
      externalId: artistExternalId,
    });

    return identifiers;
  }

  private async resolvePersonId(
    sourceSystem: SyncSourceSystemValue,
    data: {
      personId?: string;
      personExternalId?: string;
    },
    artistId?: string | null,
  ): Promise<string> {
    if (data.personId) return data.personId;

    if (data.personExternalId) {
      const mapping = await this.syncRepository.resolveTscId(
        sourceSystem,
        data.personExternalId,
        'Person',
      );
      if (mapping) return mapping.tscEntityId;
    }

    if (artistId) {
      const artistRecord = await this.syncRepository.findArtist(artistId);
      if (artistRecord?.personId) return artistRecord.personId;
    }

    throw new BadRequestException(
      'personId, personExternalId mapping, or resolvable artist required',
    );
  }
}
