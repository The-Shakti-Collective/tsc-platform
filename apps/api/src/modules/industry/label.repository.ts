import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  labelInclude,
  labelListWhere,
  MANAGES_RELATIONSHIP,
  managedArtistsWhere,
  SIGNED_TO_RELATIONSHIP,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type { LabelCreateInput, LabelListQuery, LabelSigningStubInput, LabelUpdateInput } from './dto';

type LabelRow = {
  id: string;
  name: string;
  genre: string | null;
  website: string | null;
  city: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type LabelClient = {
  findMany: (args: unknown) => Promise<LabelRow[]>;
  findUnique: (args: unknown) => Promise<LabelRow | null>;
  create: (args: unknown) => Promise<LabelRow>;
  update: (args: unknown) => Promise<LabelRow>;
};

@Injectable()
export class LabelRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get labelClient(): LabelClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & { label?: LabelClient };
    return client.label ?? null;
  }

  isAvailable(): boolean {
    return this.labelClient != null;
  }

  list(query: LabelListQuery) {
    if (!this.labelClient) return Promise.resolve([]);
    return this.labelClient.findMany({
      where: labelListWhere({ genre: query.genre, city: query.city }),
      include: labelInclude,
      orderBy: { updatedAt: 'desc' },
      take: query.limit,
    });
  }

  findById(id: string) {
    if (!this.labelClient) return Promise.resolve(null);
    return this.labelClient.findUnique({ where: { id }, include: labelInclude });
  }

  create(input: LabelCreateInput) {
    if (!this.labelClient) return Promise.resolve(null);
    return this.labelClient.create({
      data: {
        id: newId(),
        name: input.name,
        genre: input.genre ?? null,
        website: input.website || null,
        city: input.city ?? null,
      },
      include: labelInclude,
    });
  }

  update(id: string, input: LabelUpdateInput) {
    if (!this.labelClient) return Promise.resolve(null);
    return this.labelClient.update({
      where: { id },
      data: {
        name: input.name,
        genre: input.genre,
        website: input.website === '' ? null : input.website,
        city: input.city,
      },
      include: labelInclude,
    });
  }

  listRosterRelationships(labelId: string) {
    return this.prisma.client.relationship.findMany({
      where: {
        OR: [
          managedArtistsWhere('Label', labelId, SIGNED_TO_RELATIONSHIP),
          managedArtistsWhere('Label', labelId, MANAGES_RELATIONSHIP),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  countRoster(labelId: string) {
    return this.prisma.client.relationship.count({
      where: {
        OR: [
          managedArtistsWhere('Label', labelId, SIGNED_TO_RELATIONSHIP),
          managedArtistsWhere('Label', labelId, MANAGES_RELATIONSHIP),
        ],
      },
    });
  }

  createSigningStub(labelId: string, input: LabelSigningStubInput) {
    return this.prisma.client.relationship.create({
      data: {
        id: newId(),
        sourceEntityType: 'Label',
        sourceEntityId: labelId,
        targetEntityType: 'Artist',
        targetEntityId: input.artistId,
        relationshipType: SIGNED_TO_RELATIONSHIP,
        metadata: toInputJson({
          source: 'label-os',
          stub: true,
          notes: input.notes ?? null,
        }),
        effectiveFrom: new Date(),
      },
    });
  }

  resolveArtists(artistIds: string[]) {
    if (artistIds.length === 0) return Promise.resolve([]);
    return this.prisma.client.artist.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, name: true, slug: true },
    });
  }
}
