import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type {
  MembershipCreateInput,
  MembershipPatchInput,
} from '@tsc/contracts/membership-program';

type MembershipRow = {
  id: string;
  communityId: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  tier: string;
  benefits: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SubscriptionRow = {
  id: string;
  membershipId: string;
  personId: string;
  status: string;
  startedAt: Date;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  membership?: MembershipRow & { community?: { id: string; name: string; slug: string } };
};

@Injectable()
export class MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get membershipClient() {
    const client = this.prisma.client as unknown as {
      membership?: {
        findMany: (args: unknown) => Promise<MembershipRow[]>;
        findUnique: (args: unknown) => Promise<(MembershipRow & { community?: unknown }) | null>;
        create: (args: unknown) => Promise<MembershipRow>;
        update: (args: unknown) => Promise<MembershipRow>;
        count: (args: unknown) => Promise<number>;
      };
      membershipSubscription?: {
        findUnique: (args: unknown) => Promise<SubscriptionRow | null>;
        findMany: (args: unknown) => Promise<SubscriptionRow[]>;
        upsert: (args: unknown) => Promise<SubscriptionRow>;
        update: (args: unknown) => Promise<SubscriptionRow>;
        count: (args: unknown) => Promise<number>;
      };
    };
    return client.membership ?? null;
  }

  private get subscriptionClient() {
    const client = this.prisma.client as unknown as {
      membershipSubscription?: {
        findUnique: (args: unknown) => Promise<SubscriptionRow | null>;
        findMany: (args: unknown) => Promise<SubscriptionRow[]>;
        upsert: (args: unknown) => Promise<SubscriptionRow>;
        update: (args: unknown) => Promise<SubscriptionRow>;
        count: (args: unknown) => Promise<number>;
      };
    };
    return client.membershipSubscription ?? null;
  }

  isAvailable(): boolean {
    return Boolean(this.membershipClient && this.subscriptionClient);
  }

  findCommunity(id: string) {
    return this.prisma.client.community.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, artistId: true },
    });
  }

  personManagesCommunity(communityId: string, personId: string) {
    return this.prisma.client.communityMember.findFirst({
      where: {
        communityId,
        personId,
        status: 'active',
        role: { in: ['Founder', 'Admin', 'Moderator'] },
      },
    });
  }

  listProgramsByCommunity(communityId: string, activeOnly: boolean) {
    if (!this.membershipClient) return Promise.resolve([] as MembershipRow[]);
    const where: Prisma.MembershipWhereInput = { communityId };
    if (activeOnly) where.isActive = true;
    return this.membershipClient.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { price: 'asc' }, { name: 'asc' }],
    });
  }

  findProgram(id: string) {
    if (!this.membershipClient) return Promise.resolve(null);
    return this.membershipClient.findUnique({
      where: { id },
      include: {
        community: {
          select: { id: true, name: true, slug: true, artistId: true },
        },
      },
    });
  }

  createProgram(communityId: string, input: MembershipCreateInput) {
    if (!this.membershipClient) return Promise.resolve(null);
    return this.membershipClient.create({
      data: {
        communityId,
        name: input.name,
        slug: input.slug,
        price: input.price ?? 0,
        currency: input.currency ?? 'INR',
        tier: input.tier ?? 'standard',
        benefits: input.benefits ?? [],
        isActive: input.isActive ?? true,
      },
    });
  }

  updateProgram(id: string, input: MembershipPatchInput) {
    if (!this.membershipClient) return Promise.resolve(null);
    return this.membershipClient.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.tier !== undefined ? { tier: input.tier } : {}),
        ...(input.benefits !== undefined ? { benefits: input.benefits } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }

  findSubscription(membershipId: string, personId: string) {
    if (!this.subscriptionClient) return Promise.resolve(null);
    return this.subscriptionClient.findUnique({
      where: { membershipId_personId: { membershipId, personId } },
    });
  }

  listSubscriptionsForPerson(personId: string, status?: string) {
    if (!this.subscriptionClient) return Promise.resolve([] as SubscriptionRow[]);
    const where: Record<string, unknown> = { personId };
    if (status) where.status = status;
    return this.subscriptionClient.findMany({
      where,
      include: {
        membership: {
          include: {
            community: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  upsertActiveSubscription(membershipId: string, personId: string) {
    if (!this.subscriptionClient) return Promise.resolve(null);
    const now = new Date();
    return this.subscriptionClient.upsert({
      where: { membershipId_personId: { membershipId, personId } },
      create: {
        membershipId,
        personId,
        status: 'active',
        startedAt: now,
        cancelledAt: null,
        expiresAt: null,
      },
      update: {
        status: 'active',
        cancelledAt: null,
        startedAt: now,
      },
    });
  }

  cancelSubscription(membershipId: string, personId: string) {
    if (!this.subscriptionClient) return Promise.resolve(null);
    const now = new Date();
    return this.subscriptionClient.update({
      where: { membershipId_personId: { membershipId, personId } },
      data: {
        status: 'cancelled',
        cancelledAt: now,
      },
    });
  }

  upsertSubscribedToMembershipRelationship(personId: string, membershipId: string) {
    return this.prisma.client.relationship.upsert({
      where: {
        sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
          {
            sourceEntityType: 'Person',
            sourceEntityId: personId,
            targetEntityType: 'Membership',
            targetEntityId: membershipId,
            relationshipType: 'SUBSCRIBED',
          },
      },
      create: {
        id: newId(),
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Membership',
        targetEntityId: membershipId,
        relationshipType: 'SUBSCRIBED',
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'membership-subscribe' }),
      },
      update: {
        effectiveTo: null,
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'membership-subscribe' }),
      },
    });
  }

  upsertSubscribedToCommunityRelationship(personId: string, communityId: string, membershipId: string) {
    return this.prisma.client.relationship.upsert({
      where: {
        sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
          {
            sourceEntityType: 'Person',
            sourceEntityId: personId,
            targetEntityType: 'Community',
            targetEntityId: communityId,
            relationshipType: 'SUBSCRIBED',
          },
      },
      create: {
        id: newId(),
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Community',
        targetEntityId: communityId,
        relationshipType: 'SUBSCRIBED',
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'membership-subscribe', membershipId }),
      },
      update: {
        effectiveTo: null,
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'membership-subscribe', membershipId }),
      },
    });
  }

  endSubscribedRelationships(personId: string, membershipId: string, communityId: string) {
    const now = new Date();
    return Promise.all([
      this.prisma.client.relationship.updateMany({
        where: {
          sourceEntityType: 'Person',
          sourceEntityId: personId,
          targetEntityType: 'Membership',
          targetEntityId: membershipId,
          relationshipType: 'SUBSCRIBED',
          effectiveTo: null,
        },
        data: { effectiveTo: now },
      }),
      this.prisma.client.relationship.updateMany({
        where: {
          sourceEntityType: 'Person',
          sourceEntityId: personId,
          targetEntityType: 'Community',
          targetEntityId: communityId,
          relationshipType: 'SUBSCRIBED',
          effectiveTo: null,
        },
        data: { effectiveTo: now },
      }),
    ]);
  }
}
