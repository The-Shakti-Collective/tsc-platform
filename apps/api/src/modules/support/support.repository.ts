import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import type {
  SupportActionTypeValue,
  SupportTargetTypeValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type { RecordSupportInput } from '@tsc/contracts/support-action';

type SupportActionRow = {
  id: string;
  supporterPersonId: string;
  targetType: string;
  targetId: string;
  actionType: string;
  amount: number | null;
  currency: string | null;
  status: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
};

type SupporterAggregateRow = {
  supporterPersonId: string;
  _count: { _all: number };
  _sum: { amount: number | null };
  _max: { createdAt: Date | null };
};

@Injectable()
export class SupportRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get supportActionClient() {
    const client = this.prisma.client as unknown as {
      supportAction?: {
        create: (args: unknown) => Promise<SupportActionRow>;
        findMany: (args: unknown) => Promise<
          Array<
            SupportActionRow & {
              supporter?: {
                id: string;
                displayName: string | null;
                name: string | null;
                profile: { slug: string | null } | null;
              };
            }
          >
        >;
        count: (args: unknown) => Promise<number>;
        groupBy: (args: unknown) => Promise<SupporterAggregateRow[]>;
      };
    };
    return client.supportAction ?? null;
  }

  isAvailable(): boolean {
    return Boolean(this.supportActionClient);
  }

  createSupportAction(
    personId: string,
    targetType: SupportTargetTypeValue,
    targetId: string,
    input: RecordSupportInput,
  ) {
    if (!this.supportActionClient) return Promise.resolve(null);
    return this.supportActionClient.create({
      data: {
        supporterPersonId: personId,
        targetType,
        targetId,
        actionType: input.actionType,
        amount: input.amount ?? null,
        currency: input.currency ?? 'INR',
        status: input.status ?? 'recorded',
        metadata: toInputJson(input.metadata ?? {}),
      },
    });
  }

  listBySupporter(personId: string, limit: number) {
    if (!this.supportActionClient) return Promise.resolve([]);
    return this.supportActionClient.findMany({
      where: { supporterPersonId: personId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  countBySupporter(personId: string) {
    if (!this.supportActionClient) return Promise.resolve(0);
    return this.supportActionClient.count({
      where: { supporterPersonId: personId },
    });
  }

  aggregateSupporters(
    targetType: SupportTargetTypeValue,
    targetId: string,
    limit: number,
    sortBy: 'amount' | 'count',
  ) {
    if (!this.supportActionClient) return Promise.resolve([]);
    return this.supportActionClient.groupBy({
      by: ['supporterPersonId'],
      where: { targetType, targetId, status: 'recorded' },
      _count: { _all: true },
      _sum: { amount: true },
      _max: { createdAt: true },
      orderBy:
        sortBy === 'count'
          ? { _count: { supporterPersonId: 'desc' } }
          : { _sum: { amount: 'desc' } },
      take: limit,
    });
  }

  findArtist(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, displayName: true, slug: true },
    });
  }

  findCommunity(communityId: string) {
    return this.prisma.client.community.findUnique({
      where: { id: communityId },
      select: { id: true, name: true, slug: true },
    });
  }

  findEvent(eventId: string) {
    return this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, slug: true, artistId: true },
    });
  }

  findPersons(personIds: string[]) {
    if (!personIds.length) return Promise.resolve([]);
    return this.prisma.client.person.findMany({
      where: { id: { in: personIds } },
      select: {
        id: true,
        displayName: true,
        name: true,
        profile: { select: { slug: true } },
      },
    });
  }

  upsertSupportRelationship(
    personId: string,
    targetType: SupportTargetTypeValue,
    targetId: string,
    relationshipType: 'SUPPORTED' | 'PURCHASED',
    actionType: SupportActionTypeValue,
    supportActionId: string,
  ) {
    return this.prisma.client.relationship.upsert({
      where: {
        sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
          {
            sourceEntityType: 'Person',
            sourceEntityId: personId,
            targetEntityType: targetType,
            targetEntityId: targetId,
            relationshipType,
          },
      },
      create: {
        id: newId(),
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: targetType,
        targetEntityId: targetId,
        relationshipType,
        effectiveFrom: new Date(),
        metadata: toInputJson({
          source: 'support-action',
          actionType,
          supportActionId,
        }),
      },
      update: {
        effectiveTo: null,
        effectiveFrom: new Date(),
        metadata: toInputJson({
          source: 'support-action',
          actionType,
          supportActionId,
        }),
      },
    });
  }

  incrementFanSpendScore(personId: string, delta: number) {
    const client = this.prisma.client as unknown as {
      fanProfile?: {
        update: (args: unknown) => Promise<unknown>;
      };
    };
    if (!client.fanProfile || delta <= 0) return Promise.resolve(null);
    return client.fanProfile.update({
      where: { personId },
      data: { spendScore: { increment: delta } },
    });
  }
}
