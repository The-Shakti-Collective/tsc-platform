import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  IdentityMatchSignal,
  IncomingIdentifier,
  MergeConflictResolution,
  MergeIdentityInput,
  MergeIdentityPayload,
  Person360Payload,
  PersonRoleType,
  ResolveIdentityInput,
  ResolveIdentityPayload,
} from '@tsc/types';
import { SOCIAL_IDENTIFIER_PROVIDERS } from '@tsc/database';
import {
  matchConfidence,
  normalizeIdentifier,
  socialHandlesFuzzyMatch,
} from './identity-normalizer';
import { IdentityRepository } from './identity.repository';
import { IdentitySyncEmitter } from './identity-sync.emitter';
import { ProfileService } from '../profile/profile.service';
import { FanService } from '../fan/fan.service';
import { CreativeIdentityService } from '../creative-identity/creative-identity.service';

@Injectable()
export class IdentityResolutionService {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly syncEmitter: IdentitySyncEmitter,
    private readonly profileService: ProfileService,
    private readonly fanService: FanService,
    private readonly creativeIdentityService: CreativeIdentityService,
  ) {}

  async resolve(input: ResolveIdentityInput): Promise<ResolveIdentityPayload> {
    const matchSignals = await this.collectMatchSignals(input.identifiers);

    if (matchSignals.length > 0) {
      const best = this.pickBestMatch(matchSignals);
      const person = await this.repository.findActivePerson(best.personId);
      if (!person) {
        throw new NotFoundException(`Matched person ${best.personId} not found`);
      }

      await this.attachIdentifiers(person.id, input.identifiers);
      if (input.roles?.length) {
        await this.attachRoles(person.id, input.roles);
      }

      await this.profileService.ensureProfileStub({
        personId: person.id,
        displayName: person.displayName ?? person.name,
      });
      void this.fanService.ensureFanProfileStub(person.id);
      void this.creativeIdentityService.ensureStub({
        personId: person.id,
        displayName: person.displayName ?? person.name,
      });

      const payload = this.toResolvePayload(person, {
        created: false,
        matched: true,
        confidence: best.confidence,
        matchSignals,
      });

      this.syncEmitter.emit({
        type: 'identity.resolved',
        sourceSystem: 'tsc',
        externalId: person.id,
        entityType: 'Person',
        data: {
          created: false,
          matched: true,
          confidence: best.confidence,
          source: input.source ?? null,
        },
      });

      return payload;
    }

    if (input.createIfMissing === false) {
      throw new NotFoundException('No matching person found');
    }

    const email = input.identifiers.find((row) => row.provider === 'email');
    const phone = input.identifiers.find((row) => row.provider === 'phone');
    const person = await this.repository.createPerson({
      name: input.name ?? null,
      displayName: input.displayName ?? null,
      email: email ? normalizeIdentifier('email', email.externalId).normalizedId : null,
      phone: phone ? normalizeIdentifier('phone', phone.externalId).normalizedId : null,
    });

    await this.attachIdentifiers(person.id, input.identifiers);
    if (input.roles?.length) {
      await this.attachRoles(person.id, input.roles);
    }

    await this.profileService.ensureProfileStub({
      personId: person.id,
      displayName: person.displayName ?? input.displayName ?? person.name,
    });
    void this.fanService.ensureFanProfileStub(person.id);
    void this.creativeIdentityService.ensureStub({
      personId: person.id,
      displayName: person.displayName ?? input.displayName ?? person.name,
    });

    const payload = this.toResolvePayload(person, {
      created: true,
      matched: false,
      confidence: 1,
      matchSignals: [],
    });

    this.syncEmitter.emit({
      type: 'identity.resolved',
      sourceSystem: 'tsc',
      externalId: person.id,
      entityType: 'Person',
      data: {
        created: true,
        matched: false,
        source: input.source ?? null,
      },
    });

    return payload;
  }

  async merge(input: MergeIdentityInput): Promise<MergeIdentityPayload> {
    const survivor = await this.repository.findActivePerson(input.survivorPersonId);
    if (!survivor) {
      throw new NotFoundException(`Survivor person ${input.survivorPersonId} not found`);
    }

    const mergedIds = [...new Set(input.mergedPersonIds)].filter(
      (id) => id !== input.survivorPersonId,
    );
    if (mergedIds.length === 0) {
      throw new BadRequestException('No distinct persons to merge');
    }

    const conflictResolutions: MergeConflictResolution[] = [];
    const mergeLogIds: string[] = [];

    for (const mergedId of mergedIds) {
      const merged = await this.repository.findActivePerson(mergedId);
      if (!merged) {
        throw new NotFoundException(`Merged person ${mergedId} not found`);
      }

      const fieldConflicts = this.resolvePersonFieldConflicts(survivor, merged);
      conflictResolutions.push(...fieldConflicts);

      if (fieldConflicts.length > 0) {
        const patch: Record<string, unknown> = {};
        for (const conflict of fieldConflicts) {
          if (conflict.chosen !== 'survivor') {
            patch[conflict.field] = conflict.mergedValue;
          }
        }
        if (Object.keys(patch).length > 0) {
          await this.repository.updatePerson(survivor.id, patch);
        }
      }

      await this.repository.reassignPersonForeignKeys(mergedId, survivor.id);
      await this.repository.moveIdentifiers(mergedId, survivor.id);
      await this.repository.moveRoles(mergedId, survivor.id);
      await this.repository.markPersonMerged(mergedId, survivor.id);

      const log = await this.repository.createMergeLog({
        survivorPersonId: survivor.id,
        mergedPersonId: mergedId,
        reason: input.reason ?? 'manual',
        conflictResolutions: { items: fieldConflicts },
        mergedBy: input.mergedBy ?? null,
        metadata: input.metadata,
      });
      mergeLogIds.push(log.id);
    }

    const person360 = await this.buildPerson360(survivor.id);

    this.syncEmitter.emit({
      type: 'identity.merged',
      sourceSystem: 'tsc',
      externalId: survivor.id,
      entityType: 'IdentityMergeLog',
      data: {
        survivorPersonId: survivor.id,
        mergedPersonIds: mergedIds,
        mergeLogIds,
      },
    });

    return {
      survivorPersonId: survivor.id,
      mergedPersonIds: mergedIds,
      conflictResolutions,
      mergeLogIds,
      person360,
    };
  }

  async getPerson360(personId: string): Promise<Person360Payload> {
    const person = await this.repository.findPersonIncludingMerged(personId);
    if (!person) throw new NotFoundException(`Person ${personId} not found`);

    const resolvedId = person.mergedIntoId ?? person.id;
    const payload = await this.buildPerson360(resolvedId);

    this.syncEmitter.emit({
      type: 'identity.person360.requested',
      sourceSystem: 'tsc',
      externalId: resolvedId,
      entityType: 'Person',
      data: { requestedPersonId: personId, resolvedPersonId: resolvedId },
    });

    return payload;
  }

  private async buildPerson360(personId: string): Promise<Person360Payload> {
    const person = await this.repository.findActivePerson(personId);
    if (!person) throw new NotFoundException(`Person ${personId} not found`);

    const [
      identifiers,
      roles,
      mergeHistory,
      artistFollows,
      memberships,
      attendance,
      opportunityLinks,
      relationships,
    ] = await Promise.all([
      this.repository.listIdentifiers(personId),
      this.repository.listActiveRoles(personId),
      this.repository.listMergeHistory(personId),
      this.repository.listArtistFollows(personId),
      this.repository.listCommunityMemberships(personId),
      this.repository.listEventAttendance(personId),
      this.repository.listOpportunityLinks(personId),
      this.repository.listPersonRelationships(personId),
    ]);

    return {
      person: this.toPersonSummary(person),
      identifiers: identifiers.map((row) => this.toIdentifierRecord(row)),
      roles: roles.map((row) => this.toRoleRecord(row)),
      linkedEntities: {
        artists: artistFollows.map((row) => ({
          entityType: 'Artist',
          entityId: row.artistId,
          label:
            row.artist.displayName ??
            row.artist.name ??
            row.artist.slug ??
            row.artistId,
          linkedAt: row.followedAt.toISOString(),
        })),
        communities: memberships.map((row) => ({
          entityType: 'Community',
          entityId: row.communityId,
          label: row.community.name,
          role: row.role,
          linkedAt: row.joinedAt.toISOString(),
        })),
        events: attendance.map((row) => ({
          entityType: 'Event',
          entityId: row.eventId,
          label: row.event.title,
          role: row.status,
          linkedAt: row.updatedAt.toISOString(),
        })),
        opportunities: [
          ...opportunityLinks.applications.map((row) => ({
            entityType: 'Opportunity',
            entityId: row.opportunityId,
            label: row.opportunity.title,
            role: row.status,
            linkedAt: row.updatedAt.toISOString(),
          })),
          ...opportunityLinks.assigned.map((row) => ({
            entityType: 'Opportunity',
            entityId: row.id,
            label: row.title,
            role: 'assigned',
            linkedAt: row.updatedAt.toISOString(),
          })),
        ],
      },
      relationships: relationships.map((row) => ({
        id: row.id,
        sourceEntityType: row.sourceEntityType,
        sourceEntityId: row.sourceEntityId,
        targetEntityType: row.targetEntityType,
        targetEntityId: row.targetEntityId,
        relationshipType: row.relationshipType,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
      })),
      mergeHistory: mergeHistory.map((row) => this.toMergeLogRecord(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  private async collectMatchSignals(
    identifiers: IncomingIdentifier[],
  ): Promise<IdentityMatchSignal[]> {
    const signals: IdentityMatchSignal[] = [];

    for (const identifier of identifiers) {
      const normalized = normalizeIdentifier(
        identifier.provider,
        identifier.externalId,
      );

      const exact = await this.repository.findIdentifierExact(
        identifier.provider,
        normalized.externalId,
      );

      if (exact) {
        signals.push({
          provider: identifier.provider,
          externalId: normalized.externalId,
          normalizedId: normalized.normalizedId,
          matchType: 'exact',
          confidence: matchConfidence(
            identifier.provider,
            'exact',
            exact.verified,
          ),
          personId: exact.personId,
        });
        continue;
      }

      if (identifier.provider === 'phone' || identifier.provider === 'email') {
        const normalizedMatch = await this.repository.findIdentifierExact(
          identifier.provider,
          normalized.normalizedId,
        );
        if (normalizedMatch) {
          signals.push({
            provider: identifier.provider,
            externalId: normalized.externalId,
            normalizedId: normalized.normalizedId,
            matchType: 'normalized',
            confidence: matchConfidence(
              identifier.provider,
              'normalized',
              normalizedMatch.verified,
            ),
            personId: normalizedMatch.personId,
          });
        }
        continue;
      }

      if (SOCIAL_IDENTIFIER_PROVIDERS.includes(identifier.provider)) {
        const fuzzyRows = await this.repository.findSocialFuzzyCandidates(
          identifier.provider,
          normalized.normalizedId,
        );

        for (const row of fuzzyRows) {
          const candidate = (row.normalizedId ?? row.externalId).toLowerCase();
          if (
            socialHandlesFuzzyMatch(candidate, normalized.normalizedId)
          ) {
            signals.push({
              provider: identifier.provider,
              externalId: normalized.externalId,
              normalizedId: normalized.normalizedId,
              matchType: 'fuzzy',
              confidence: matchConfidence(
                identifier.provider,
                'fuzzy',
                row.verified,
              ),
              personId: row.personId,
            });
          }
        }
      }
    }

    return signals;
  }

  private pickBestMatch(signals: IdentityMatchSignal[]): IdentityMatchSignal {
    return [...signals].sort((a, b) => b.confidence - a.confidence)[0];
  }

  private async attachIdentifiers(
    personId: string,
    identifiers: IncomingIdentifier[],
  ) {
    for (const identifier of identifiers) {
      await this.repository.upsertIdentifier(personId, identifier);
    }
  }

  private async attachRoles(
    personId: string,
    roles: NonNullable<ResolveIdentityInput['roles']>,
  ) {
    const existing = await this.repository.listActiveRoles(personId);
    const existingKeys = new Set(
      existing.map((row) => `${row.role}:${row.entityType ?? ''}:${row.entityId ?? ''}`),
    );

    for (const role of roles) {
      const key = `${role.role}:${role.entityType ?? ''}:${role.entityId ?? ''}`;
      if (existingKeys.has(key)) continue;
      await this.repository.createRole({
        personId,
        role: role.role,
        entityType: role.entityType ?? null,
        entityId: role.entityId ?? null,
        metadata: role.metadata,
      });
    }
  }

  private resolvePersonFieldConflicts(
    survivor: {
      name: string | null;
      displayName: string | null;
      email: string | null;
      phone: string | null;
    },
    merged: {
      name: string | null;
      displayName: string | null;
      email: string | null;
      phone: string | null;
    },
  ): MergeConflictResolution[] {
    const conflicts: MergeConflictResolution[] = [];

    for (const field of ['name', 'displayName', 'email', 'phone'] as const) {
      const survivorValue = survivor[field];
      const mergedValue = merged[field];
      if (!mergedValue || survivorValue === mergedValue) continue;

      conflicts.push({
        field,
        survivorValue,
        mergedValue,
        chosen: survivorValue ? 'survivor' : 'merged',
      });
    }

    return conflicts;
  }

  private toResolvePayload(
    person: {
      id: string;
      name: string | null;
      displayName: string | null;
      email: string | null;
      phone: string | null;
      mergedIntoId?: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    meta: {
      created: boolean;
      matched: boolean;
      confidence: number;
      matchSignals: IdentityMatchSignal[];
    },
  ): ResolveIdentityPayload {
    return {
      personId: person.id,
      created: meta.created,
      matched: meta.matched,
      confidence: meta.confidence,
      matchSignals: meta.matchSignals,
      person: this.toPersonSummary(person),
    };
  }

  private toPersonSummary(person: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    mergedIntoId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: person.id,
      name: person.name,
      displayName: person.displayName,
      email: person.email,
      phone: person.phone,
      mergedIntoId: person.mergedIntoId ?? null,
      createdAt: person.createdAt.toISOString(),
      updatedAt: person.updatedAt.toISOString(),
    };
  }

  private toIdentifierRecord(row: {
    id: string;
    personId: string;
    provider: string;
    externalId: string;
    normalizedId: string | null;
    verified: boolean;
    primary: boolean;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      personId: row.personId,
      provider: row.provider as IdentityMatchSignal['provider'],
      externalId: row.externalId,
      normalizedId: row.normalizedId,
      verified: row.verified,
      primary: row.primary,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toRoleRecord(row: {
    id: string;
    personId: string;
    role: string;
    status: string;
    entityType: string | null;
    entityId: string | null;
    metadata: unknown;
    assignedAt: Date;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      personId: row.personId,
      role: row.role as PersonRoleType,
      status: row.status as 'active' | 'inactive' | 'pending',
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      assignedAt: row.assignedAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toMergeLogRecord(row: {
    id: string;
    survivorPersonId: string;
    mergedPersonId: string;
    reason: string;
    matchSignals: unknown;
    conflictResolutions: unknown;
    mergedBy: string | null;
    metadata: unknown;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      survivorPersonId: row.survivorPersonId,
      mergedPersonId: row.mergedPersonId,
      reason: row.reason as 'manual' | 'auto_match' | 'sync_reconcile' | 'admin_override',
      matchSignals: (row.matchSignals as Record<string, unknown>) ?? null,
      conflictResolutions:
        (row.conflictResolutions as Record<string, unknown>) ?? null,
      mergedBy: row.mergedBy,
      metadata: (row.metadata as Record<string, unknown>) ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
