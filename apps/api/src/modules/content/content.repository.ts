import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database/client';
import { PrismaService } from '../../common/database/prisma.service';
import type {
  ContentAssetCreateInput,
  ContentItemCreateInput,
  ContentItemPatchInput,
} from './schema';

@Injectable()
export class ContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  listAssets(artistId: string, releaseId?: string, limit = 25) {
    return this.prisma.client.contentAsset.findMany({
      where: {
        artistId,
        ...(releaseId ? { releaseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  createAsset(data: ContentAssetCreateInput) {
    return this.prisma.client.contentAsset.create({
      data: {
        artistId: data.artistId,
        title: data.title,
        assetType: data.assetType,
        releaseId: data.releaseId,
        mimeType: data.mimeType,
        storageKey: data.storageKey,
        url: data.url,
        sizeBytes: data.sizeBytes,
      },
    });
  }

  listItems(artistId: string, limit = 25) {
    return this.prisma.client.contentItem.findMany({
      where: { artistId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  createItem(data: ContentItemCreateInput) {
    return this.prisma.client.contentItem.create({
      data: {
        artistId: data.artistId,
        title: data.title,
        body: data.body,
        status: data.status,
        publishedAt: data.status === 'published' ? new Date() : undefined,
      },
    });
  }

  patchItem(id: string, data: ContentItemPatchInput & { publishedAt?: Date }) {
    return this.prisma.client.contentItem.update({ where: { id }, data });
  }
}
