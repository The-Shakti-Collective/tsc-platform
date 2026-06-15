import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database/client';
import { PrismaService } from '../../common/database/prisma.service';
import type { ReleaseCreateInput, ReleasePatchInput } from './schema';

@Injectable()
export class ReleasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string, artistId?: string, status?: string, limit = 25) {
    return this.prisma.client.release.findMany({
      where: {
        organizationId,
        ...(artistId ? { artistId } : {}),
        ...(status ? { status: status as 'draft' | 'scheduled' | 'released' | 'archived' } : {}),
      },
      orderBy: { releaseDate: 'desc' },
      take: limit,
      include: {
        tracks: { orderBy: { trackNumber: 'asc' } },
        artist: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  findById(id: string) {
    return this.prisma.client.release.findUnique({
      where: { id },
      include: {
        tracks: { orderBy: { trackNumber: 'asc' } },
        artist: { select: { id: true, name: true, slug: true } },
        royalties: true,
      },
    });
  }

  create(data: ReleaseCreateInput) {
    const { tracks, dspLinks, ...release } = data;
    return this.prisma.client.release.create({
      data: {
        organizationId: release.organizationId,
        artistId: release.artistId,
        title: release.title,
        type: release.type,
        releaseDate: release.releaseDate,
        upc: release.upc,
        isrc: release.isrc,
        distributor: release.distributor,
        campaignNotes: release.campaignNotes,
        dspLinks: (dspLinks ?? []) as Prisma.InputJsonValue,
        tracks: tracks?.length
          ? {
              create: tracks.map((track) => ({
                title: track.title,
                trackNumber: track.trackNumber,
                isrc: track.isrc,
                durationSec: track.durationSec,
              })),
            }
          : undefined,
      },
      include: { tracks: true },
    });
  }

  patch(id: string, data: ReleasePatchInput) {
    const { tracks: _tracks, dspLinks, ...rest } = data;
    return this.prisma.client.release.update({
      where: { id },
      data: {
        ...rest,
        ...(dspLinks !== undefined
          ? { dspLinks: dspLinks as Prisma.InputJsonValue }
          : {}),
      },
      include: { tracks: true },
    });
  }
}
