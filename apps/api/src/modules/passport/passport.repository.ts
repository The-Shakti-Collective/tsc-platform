import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  artistPassportInclude,
  PASSPORT_CAREER_RELATIONSHIP_TYPES,
  passportPublicWhere,
  passportSlugWhere,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type { PassportEditInput } from './dto';

@Injectable()
export class PassportRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string) {
    return this.prisma.client.artistPassport.findFirst({
      where: passportSlugWhere(slug),
      include: artistPassportInclude,
    });
  }

  findPublicBySlug(slug: string) {
    return this.prisma.client.artistPassport.findFirst({
      where: passportPublicWhere(slug),
      include: artistPassportInclude,
    });
  }

  findByArtistId(artistId: string) {
    return this.prisma.client.artistPassport.findUnique({
      where: { artistId },
      include: artistPassportInclude,
    });
  }

  findArtistById(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        slug: true,
        displayName: true,
        name: true,
        personId: true,
        bio: true,
        photoUrl: true,
        metadata: true,
      },
    });
  }

  findArtistBySlug(slug: string) {
    return this.prisma.client.artist.findFirst({
      where: { slug: { equals: slug, mode: 'insensitive' } },
      select: {
        id: true,
        slug: true,
        displayName: true,
        name: true,
        personId: true,
        bio: true,
        photoUrl: true,
        metadata: true,
      },
    });
  }

  createStub(input: { artistId: string; slug: string; headline?: string | null }) {
    return this.prisma.client.artistPassport.create({
      data: {
        id: newId(),
        artistId: input.artistId,
        slug: input.slug,
        headline: input.headline ?? null,
        isPublic: false,
        links: toInputJson([]),
      },
      include: artistPassportInclude,
    });
  }

  updatePassport(artistId: string, input: PassportEditInput) {
    const data: Prisma.ArtistPassportUpdateInput = {};

    if (input.isPublic !== undefined) data.isPublic = input.isPublic;
    if (input.showHealthScore !== undefined) data.showHealthScore = input.showHealthScore;
    if (input.showCommunityScore !== undefined) {
      data.showCommunityScore = input.showCommunityScore;
    }
    if (input.showActivityScore !== undefined) data.showActivityScore = input.showActivityScore;
    if (input.showOpportunityHistory !== undefined) {
      data.showOpportunityHistory = input.showOpportunityHistory;
    }
    if (input.showCareerGraph !== undefined) data.showCareerGraph = input.showCareerGraph;
    if (input.headline !== undefined) data.headline = input.headline;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl;
    if (input.links !== undefined) data.links = toInputJson(input.links);

    return this.prisma.client.artistPassport.update({
      where: { artistId },
      data,
      include: artistPassportInclude,
    });
  }

  updateCachedEcosystemScore(artistId: string, score: number | null) {
    return this.prisma.client.artistPassport.update({
      where: { artistId },
      data: {
        cachedEcosystemScore: score,
        ecosystemScoreUpdatedAt: new Date(),
      },
    });
  }

  findLatestHealthSnapshot(artistId: string) {
    return this.prisma.client.artistHealthSnapshot.findFirst({
      where: { artistId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  findPrimaryCommunityId(artistId: string) {
    return this.prisma.client.community.findFirst({
      where: { artistId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
  }

  findLatestCommunitySnapshot(communityId: string) {
    return this.prisma.client.communityIntelligenceSnapshot.findFirst({
      where: { communityId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  listCareerRelationships(artistId: string) {
    return this.prisma.client.relationship.findMany({
      where: {
        relationshipType: { in: [...PASSPORT_CAREER_RELATIONSHIP_TYPES] },
        OR: [
          { sourceEntityType: 'Artist', sourceEntityId: artistId },
          { targetEntityType: 'Artist', targetEntityId: artistId },
        ],
      },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
      take: 60,
    });
  }

  async resolveEntityTitles(
    refs: Array<{ entityType: string; entityId: string }>,
  ): Promise<Map<string, string>> {
    const byType = new Map<string, Set<string>>();
    for (const ref of refs) {
      const ids = byType.get(ref.entityType) ?? new Set<string>();
      ids.add(ref.entityId);
      byType.set(ref.entityType, ids);
    }

    const titles = new Map<string, string>();

    const artistIds = [...(byType.get('Artist') ?? [])];
    if (artistIds.length > 0) {
      const rows = await this.prisma.client.artist.findMany({
        where: { id: { in: artistIds } },
        select: { id: true, displayName: true, name: true, slug: true },
      });
      for (const row of rows) {
        titles.set(key('Artist', row.id), row.displayName ?? row.name ?? row.slug ?? row.id);
      }
    }

    const eventIds = [...(byType.get('Event') ?? [])];
    if (eventIds.length > 0) {
      const rows = await this.prisma.client.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, title: true },
      });
      for (const row of rows) {
        titles.set(key('Event', row.id), row.title);
      }
    }

    const communityIds = [...(byType.get('Community') ?? [])];
    if (communityIds.length > 0) {
      const rows = await this.prisma.client.community.findMany({
        where: { id: { in: communityIds } },
        select: { id: true, name: true },
      });
      for (const row of rows) {
        titles.set(key('Community', row.id), row.name);
      }
    }

    const venueIds = [...(byType.get('Venue') ?? [])];
    if (venueIds.length > 0) {
      const rows = await this.prisma.client.venue.findMany({
        where: { id: { in: venueIds } },
        select: { id: true, name: true },
      });
      for (const row of rows) {
        titles.set(key('Venue', row.id), row.name);
      }
    }

    return titles;
  }
}

function key(entityType: string, entityId: string): string {
  return `${entityType}:${entityId}`;
}
