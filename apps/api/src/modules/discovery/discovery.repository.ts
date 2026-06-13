import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class DiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPersonProfile(personId: string) {
    const profile = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        personProfile?: {
          findUnique: (args: unknown) => Promise<{
            city: string | null;
            genres: string[];
            skills: string[];
          } | null>;
        };
      }
    ).personProfile;
    if (!profile) return Promise.resolve(null);
    return profile.findUnique({
      where: { personId },
      select: { city: true, genres: true, skills: true },
    });
  }

  listPersonCommunityIds(personId: string) {
    const member = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        communityMember?: {
          findMany: (args: unknown) => Promise<Array<{ communityId: string }>>;
        };
      }
    ).communityMember;
    if (!member) return Promise.resolve([] as string[]);
    return member
      .findMany({
        where: { personId, status: 'active' },
        select: { communityId: true },
      })
      .then((rows) => rows.map((r) => r.communityId));
  }

  listFollowingIds(personId: string) {
    const follow = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        personFollow?: {
          findMany: (args: unknown) => Promise<Array<{ followingPersonId: string }>>;
        };
      }
    ).personFollow;
    if (!follow) return Promise.resolve([] as string[]);
    return follow
      .findMany({
        where: { followerPersonId: personId },
        select: { followingPersonId: true },
      })
      .then((rows) => rows.map((r) => r.followingPersonId));
  }

  listConnectedPersonIds(personId: string) {
    return this.prisma.client.relationship
      .findMany({
        where: {
          OR: [
            { sourceEntityType: 'Person', sourceEntityId: personId },
            { targetEntityType: 'Person', targetEntityId: personId },
          ],
          relationshipType: {
            in: ['COLLABORATED_WITH', 'WORKED_WITH', 'FOLLOWS'],
          },
          effectiveTo: null,
        },
        select: {
          sourceEntityType: true,
          sourceEntityId: true,
          targetEntityType: true,
          targetEntityId: true,
        },
        take: 200,
      })
      .then((rows) => {
        const ids = new Set<string>();
        for (const row of rows) {
          if (row.sourceEntityType === 'Person' && row.sourceEntityId !== personId) {
            ids.add(row.sourceEntityId);
          }
          if (row.targetEntityType === 'Person' && row.targetEntityId !== personId) {
            ids.add(row.targetEntityId);
          }
        }
        return [...ids];
      });
  }

  discoverPeople(input: {
    personId: string;
    communityIds: string[];
    city: string | null;
    genres: string[];
    excludeIds: string[];
    limit: number;
  }) {
    const member = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        communityMember?: {
          findMany: (args: unknown) => Promise<
            Array<{
              personId: string;
              person: {
                id: string;
                displayName: string | null;
                name: string | null;
                profile?: {
                  slug: string;
                  city: string | null;
                  genres: string[];
                } | null;
              };
            }>
          >;
        };
      }
    ).communityMember;

    if (!member || input.communityIds.length === 0) {
      return this.discoverPeopleByProfile(input);
    }

    return member
      .findMany({
        where: {
          communityId: { in: input.communityIds },
          status: 'active',
          personId: { notIn: [input.personId, ...input.excludeIds] },
        },
        include: {
          person: {
            select: {
              id: true,
              displayName: true,
              name: true,
              profile: {
                select: { slug: true, city: true, genres: true },
              },
            },
          },
        },
        take: input.limit * 3,
      })
      .then((rows) => {
        const byPerson = new Map<string, (typeof rows)[number] & { shared: number }>();
        for (const row of rows) {
          const existing = byPerson.get(row.personId);
          if (existing) {
            existing.shared += 1;
          } else {
            byPerson.set(row.personId, { ...row, shared: 1 });
          }
        }
        return [...byPerson.values()];
      });
  }

  private discoverPeopleByProfile(input: {
    personId: string;
    city: string | null;
    genres: string[];
    excludeIds: string[];
    limit: number;
  }) {
    const profile = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        personProfile?: {
          findMany: (args: unknown) => Promise<
            Array<{
              personId: string;
              slug: string;
              city: string | null;
              genres: string[];
              person: {
                id: string;
                displayName: string | null;
                name: string | null;
              };
            }>
          >;
        };
      }
    ).personProfile;
    if (!profile) return Promise.resolve([]);

    const where: Prisma.PersonProfileWhereInput = {
      personId: { notIn: [input.personId, ...input.excludeIds] },
    };
    if (input.city?.trim()) {
      where.city = { equals: input.city.trim(), mode: 'insensitive' };
    }
    if (input.genres.length > 0) {
      where.genres = { hasSome: input.genres };
    }

    return profile.findMany({
      where,
      include: {
        person: {
          select: { id: true, displayName: true, name: true },
        },
      },
      take: input.limit,
    }).then((rows) =>
      rows.map((row) => ({
        personId: row.personId,
        shared: 0,
        person: {
          id: row.person.id,
          displayName: row.person.displayName,
          name: row.person.name,
          profile: {
            slug: row.slug,
            city: row.city,
            genres: row.genres,
          },
        },
      })),
    );
  }

  discoverCommunities(input: {
    personId: string;
    communityIds: string[];
    followingIds: string[];
    city: string | null;
    genres: string[];
    limit: number;
  }) {
    const where: Prisma.CommunityWhereInput = {
      id: input.communityIds.length > 0 ? { notIn: input.communityIds } : undefined,
    };
    if (input.city?.trim()) {
      where.city = { equals: input.city.trim(), mode: 'insensitive' };
    }

    return this.prisma.client.community
      .findMany({
        where,
        include: {
          _count: { select: { members: true } },
          members: input.followingIds.length
            ? {
                where: {
                  personId: { in: input.followingIds },
                  status: 'active',
                },
                select: { personId: true },
              }
            : false,
        },
        orderBy: { updatedAt: 'desc' },
        take: input.limit * 2,
      })
      .then((rows) =>
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          city: row.city ?? null,
          genres: (row as { genres?: string[] }).genres ?? [],
          memberCount: row._count.members,
          friendsInCommunity: Array.isArray(row.members) ? row.members.length : 0,
        })),
      );
  }

  discoverEvents(input: {
    personId: string;
    city: string | null;
    attendedCities: string[];
    limit: number;
  }) {
    const cities = [...new Set([input.city, ...input.attendedCities].filter(Boolean))] as string[];
    const where: Prisma.EventWhereInput = {
      startsAt: { gte: new Date() },
    };
    if (cities.length > 0) {
      where.city = { in: cities, mode: 'insensitive' };
    }

    return this.prisma.client.event.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      take: input.limit,
      select: {
        id: true,
        title: true,
        city: true,
        startsAt: true,
      },
    });
  }

  listAttendedEventCities(personId: string) {
    const participation = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        eventParticipation?: {
          findMany: (args: unknown) => Promise<
            Array<{ event: { city: string | null } | null }>
          >;
        };
      }
    ).eventParticipation;
    if (!participation) return Promise.resolve([] as string[]);
    return participation
      .findMany({
        where: { personId, status: 'checked_in' },
        include: { event: { select: { city: true } } },
        take: 30,
        orderBy: { checkedInAt: 'desc' },
      })
      .then((rows) =>
        [...new Set(rows.map((r) => r.event?.city).filter(Boolean))] as string[],
      );
  }

  discoverCollaborations(input: {
    skills: string[];
    city: string | null;
    limit: number;
  }) {
    const client = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        collaboration?: {
          findMany: (args: unknown) => Promise<
            Array<{
              id: string;
              title: string;
              type: string;
              city: string | null;
              genres: string[];
            }>
          >;
        };
      }
    ).collaboration;
    if (!client) return Promise.resolve([]);

    const where: Record<string, unknown> = { status: 'open' };
    if (input.city?.trim()) {
      where.city = { contains: input.city.trim(), mode: 'insensitive' };
    }

    return client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: input.limit * 2,
      select: {
        id: true,
        title: true,
        type: true,
        city: true,
        genres: true,
      },
    });
  }
}
