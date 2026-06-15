import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database/client';
import { PrismaService } from '../../common/database/prisma.service';
import type {
  DistributionChannelCreateInput,
  DistributionSubmissionCreateInput,
} from './schema';

@Injectable()
export class DistributionRepository {
  constructor(private readonly prisma: PrismaService) {}

  listChannels(artistId?: string, limit = 25) {
    return this.prisma.client.distributionChannel.findMany({
      where: artistId ? { artistId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  createChannel(data: DistributionChannelCreateInput) {
    return this.prisma.client.distributionChannel.create({
      data: {
        artistId: data.artistId,
        provider: data.provider,
        name: data.name,
        config: (data.config ?? {}) as Prisma.InputJsonValue,
      },
    });
  }
  listSubmissions(channelId?: string, limit = 25) {
    return this.prisma.client.distributionSubmission.findMany({
      where: channelId ? { channelId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        channel: { select: { id: true, name: true, provider: true } },
        release: { select: { id: true, title: true } },
      },
    });
  }

  findChannelById(id: string) {
    return this.prisma.client.distributionChannel.findUnique({ where: { id } });
  }

  createSubmission(data: DistributionSubmissionCreateInput) {
    return this.prisma.client.distributionSubmission.create({
      data: {
        channelId: data.channelId,
        releaseId: data.releaseId,
        title: data.title,
        upc: data.upc,
        isrc: data.isrc,
      },
      include: {
        channel: { select: { id: true, name: true, provider: true } },
      },
    });
  }
}
