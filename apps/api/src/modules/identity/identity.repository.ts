import { Injectable } from '@nestjs/common';
import type { IdentityMergeReasonValue, PersonRoleTypeValue, Prisma } from '@tsc/database';
import {
  activePersonWhere,
  identifierLookupWhere,
  person360Include,
  type IdentifierProviderValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import { optionalPrismaClient } from '../../common/prisma/optional-client';
import type { IncomingIdentifier } from '@tsc/types';
import { normalizeIdentifier } from './identity-normalizer';

@Injectable()
export class IdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActivePerson(id: string) {
    return this.prisma.client.person.findFirst({
      where: { id, ...activePersonWhere() },
      include: person360Include,
    });
  }

  findProfileByUsername(username: string) {
    return this.prisma.client.personProfile.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      include: {
        person: true,
      },
    });
  }

  findPersonIncludingMerged(id: string) {
    return this.prisma.client.person.findUnique({
      where: { id },
      include: person360Include,
    });
  }

  findIdentifierExact(provider: IdentifierProviderValue, externalId: string) {
    return this.prisma.client.personIdentifier.findFirst({
      where: identifierLookupWhere({ provider, externalId }),
      include: { person: true },
    });
  }

  async findSocialFuzzyCandidates(
    provider: IdentifierProviderValue,
    normalizedId: string,
  ) {
    const rows = await this.prisma.client.personIdentifier.findMany({
      where: {
        provider,
        person: activePersonWhere(),
      },
      take: 200,
      orderBy: { updatedAt: 'desc' },
      include: { person: true },
    });

    return rows.filter((row) => {
      const candidate = row.normalizedId ?? row.externalId;
      return candidate.toLowerCase().includes(normalizedId) ||
        normalizedId.includes(candidate.toLowerCase());
    });
  }

  createPerson(input: {
    name?: string | null;
    displayName?: string | null;
    email?: string | null;
    phone?: string | null;
  }) {
    return this.prisma.client.person.create({
      data: {
        id: newId(),
        name: input.name ?? null,
        displayName: input.displayName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
      },
    });
  }

  upsertIdentifier(personId: string, identifier: IncomingIdentifier) {
    const normalized = normalizeIdentifier(
      identifier.provider,
      identifier.externalId,
    );

    return this.prisma.client.personIdentifier.upsert({
      where: {
        provider_externalId: {
          provider: identifier.provider,
          externalId: normalized.externalId,
        },
      },
      create: {
        id: newId(),
        personId,
        provider: identifier.provider,
        externalId: normalized.externalId,
        normalizedId: normalized.normalizedId,
        verified: identifier.verified ?? false,
        primary: identifier.primary ?? false,
        metadata: toInputJson(identifier.metadata),
      },
      update: {
        personId,
        normalizedId: normalized.normalizedId,
        verified: identifier.verified,
        primary: identifier.primary,
        metadata:
          identifier.metadata !== undefined
            ? toInputJson(identifier.metadata)
            : undefined,
      },
    });
  }

  createRole(input: {
    personId: string;
    role: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.personRole.create({
      data: {
        id: newId(),
        personId: input.personId,
        role: input.role as PersonRoleTypeValue,
        status: 'active',
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: toInputJson(input.metadata),
      },
    });
  }

  listIdentifiers(personId: string) {
    return this.prisma.client.personIdentifier.findMany({
      where: { personId },
      orderBy: { createdAt: 'asc' },
    });
  }

  listActiveRoles(personId: string) {
    return this.prisma.client.personRole.findMany({
      where: { personId, status: 'active' },
      orderBy: { assignedAt: 'desc' },
    });
  }

  listMergeHistory(personId: string) {
    return this.prisma.client.identityMergeLog.findMany({
      where: {
        OR: [{ survivorPersonId: personId }, { mergedPersonId: personId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listArtistFollows(personId: string) {
    return this.prisma.client.artistFollow.findMany({
      where: { personId },
      include: {
        artist: { select: { id: true, displayName: true, name: true, slug: true } },
      },
      orderBy: { followedAt: 'desc' },
      take: 50,
    });
  }

  async listCommunityMemberships(personId: string) {
    return this.prisma.client.communityMember.findMany({
      where: { personId },
      include: {
        community: { select: { id: true, name: true } },
      },
      orderBy: { joinedAt: 'desc' },
      take: 50,
    });
  }

  async listEventAttendance(personId: string) {
    return this.prisma.client.eventParticipation.findMany({
      where: { personId },
      include: {
        event: { select: { id: true, title: true, startsAt: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async listOpportunityLinks(personId: string) {
    const [applications, assigned] = await Promise.all([
      this.prisma.client.opportunityApplication.findMany({
        where: { personId },
        include: { opportunity: { select: { id: true, title: true, status: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.client.opportunity.findMany({
        where: {
          metadata: {
            path: ['assignedToId'],
            equals: personId,
          },
        },
        select: { id: true, title: true, status: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
    ]);

    return { applications, assigned };
  }

  listPersonRelationships(personId: string) {
    return this.prisma.client.relationship.findMany({
      where: {
        OR: [
          { sourceEntityType: 'Person', sourceEntityId: personId },
          { targetEntityType: 'Person', targetEntityId: personId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  updatePerson(
    id: string,
    data: Prisma.PersonUpdateInput,
  ) {
    return this.prisma.client.person.update({ where: { id }, data });
  }

  markPersonMerged(personId: string, survivorPersonId: string) {
    return this.prisma.client.person.update({
      where: { id: personId },
      data: { mergedIntoId: survivorPersonId },
    });
  }

  listIdentifiersForPerson(personId: string) {
    return this.prisma.client.personIdentifier.findMany({
      where: { personId },
    });
  }

  deleteIdentifier(id: string) {
    return this.prisma.client.personIdentifier.delete({ where: { id } });
  }

  async moveIdentifiers(fromPersonId: string, toPersonId: string) {
    const [fromRows, toRows] = await Promise.all([
      this.listIdentifiersForPerson(fromPersonId),
      this.listIdentifiersForPerson(toPersonId),
    ]);

    const survivorKeys = new Set(
      toRows.map((row) => `${row.provider}:${row.externalId}`),
    );

    for (const row of fromRows) {
      const key = `${row.provider}:${row.externalId}`;
      if (survivorKeys.has(key)) {
        await this.deleteIdentifier(row.id);
        continue;
      }

      await this.prisma.client.personIdentifier.update({
        where: { id: row.id },
        data: { personId: toPersonId },
      });
      survivorKeys.add(key);
    }
  }

  async moveRoles(fromPersonId: string, toPersonId: string) {
    const [fromRows, toRows] = await Promise.all([
      this.prisma.client.personRole.findMany({ where: { personId: fromPersonId } }),
      this.prisma.client.personRole.findMany({ where: { personId: toPersonId } }),
    ]);

    const survivorKeys = new Set(
      toRows.map((row) => `${row.role}:${row.entityType ?? ''}:${row.entityId ?? ''}`),
    );

    for (const row of fromRows) {
      const key = `${row.role}:${row.entityType ?? ''}:${row.entityId ?? ''}`;
      if (survivorKeys.has(key)) {
        await this.prisma.client.personRole.delete({ where: { id: row.id } });
        continue;
      }

      await this.prisma.client.personRole.update({
        where: { id: row.id },
        data: { personId: toPersonId },
      });
      survivorKeys.add(key);
    }
  }

  createMergeLog(input: {
    survivorPersonId: string;
    mergedPersonId: string;
    reason: string;
    matchSignals?: Record<string, unknown>;
    conflictResolutions?: Record<string, unknown>;
    mergedBy?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.identityMergeLog.create({
      data: {
        id: newId(),
        survivorPersonId: input.survivorPersonId,
        mergedPersonId: input.mergedPersonId,
        reason: input.reason as IdentityMergeReasonValue,
        matchSignals: toInputJson(input.matchSignals),
        conflictResolutions: toInputJson(input.conflictResolutions),
        mergedBy: input.mergedBy ?? null,
        metadata: toInputJson(input.metadata),
      },
    });
  }

  async reassignPersonForeignKeys(fromPersonId: string, toPersonId: string) {
    const leadScore = optionalPrismaClient<{
      updateMany: (args: unknown) => Promise<unknown>;
    }>(this.prisma.client, 'leadScore');
    const audienceSnapshot = optionalPrismaClient<{
      updateMany: (args: unknown) => Promise<unknown>;
    }>(this.prisma.client, 'audienceSnapshot');
    const recommendationCandidate = optionalPrismaClient<{
      updateMany: (args: unknown) => Promise<unknown>;
    }>(this.prisma.client, 'recommendationCandidate');

    const updates: Array<Promise<unknown>> = [
      this.prisma.client.artistFollow.updateMany({
        where: { personId: fromPersonId },
        data: { personId: toPersonId },
      }),
      this.prisma.client.communityMember.updateMany({
        where: { personId: fromPersonId },
        data: { personId: toPersonId },
      }),
      this.prisma.client.eventParticipation.updateMany({
        where: { personId: fromPersonId },
        data: { personId: toPersonId },
      }),
      this.prisma.client.fanIntelligenceSnapshot.updateMany({
        where: { personId: fromPersonId },
        data: { personId: toPersonId },
      }),
      this.prisma.client.automationRun.updateMany({
        where: { personId: fromPersonId },
        data: { personId: toPersonId },
      }),
      this.prisma.client.opportunityApplication.updateMany({
        where: { personId: fromPersonId },
        data: { personId: toPersonId },
      }),
    ];

    if (leadScore) {
      updates.push(
        leadScore.updateMany({
          where: { personId: fromPersonId },
          data: { personId: toPersonId },
        }),
      );
    }
    if (audienceSnapshot) {
      updates.push(
        audienceSnapshot.updateMany({
          where: { personId: fromPersonId },
          data: { personId: toPersonId },
        }),
      );
    }
    if (recommendationCandidate) {
      updates.push(
        recommendationCandidate.updateMany({
          where: { personId: fromPersonId },
          data: { personId: toPersonId },
        }),
      );
    }

    await Promise.all(updates);
    await this.reassignAssignedOpportunities(fromPersonId, toPersonId);
  }

  private async reassignAssignedOpportunities(fromPersonId: string, toPersonId: string) {
    const rows = await this.prisma.client.opportunity.findMany({
      where: {
        metadata: {
          path: ['assignedToId'],
          equals: fromPersonId,
        },
      },
      select: { id: true, metadata: true },
    });

    await Promise.all(
      rows.map((row) => {
        const base =
          row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, unknown>)
            : {};
        return this.prisma.client.opportunity.update({
          where: { id: row.id },
          data: {
            metadata: toInputJson({ ...base, assignedToId: toPersonId }),
          },
        });
      }),
    );
  }
}
