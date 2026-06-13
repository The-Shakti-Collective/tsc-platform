import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  agencyInclude,
  agencyListWhere,
  MANAGES_RELATIONSHIP,
  managedArtistsWhere,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import type { AgencyCreateInput, AgencyListQuery, AgencyUpdateInput } from './dto';

type AgencyRow = {
  id: string;
  name: string;
  website: string | null;
  city: string | null;
  teamSize: number | null;
  personId: string | null;
  createdAt: Date;
  updatedAt: Date;
  contact?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile?: { slug: string; username: string | null } | null;
  } | null;
};

type AgencyClient = {
  findMany: (args: unknown) => Promise<AgencyRow[]>;
  findUnique: (args: unknown) => Promise<AgencyRow | null>;
  create: (args: unknown) => Promise<AgencyRow>;
  update: (args: unknown) => Promise<AgencyRow>;
};

@Injectable()
export class AgencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get agencyClient(): AgencyClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & { agency?: AgencyClient };
    return client.agency ?? null;
  }

  isAvailable(): boolean {
    return this.agencyClient != null;
  }

  list(query: AgencyListQuery) {
    if (!this.agencyClient) return Promise.resolve([]);
    return this.agencyClient.findMany({
      where: agencyListWhere({ city: query.city }),
      include: agencyInclude,
      orderBy: { updatedAt: 'desc' },
      take: query.limit,
    });
  }

  findById(id: string) {
    if (!this.agencyClient) return Promise.resolve(null);
    return this.agencyClient.findUnique({ where: { id }, include: agencyInclude });
  }

  create(input: AgencyCreateInput, personId?: string | null) {
    if (!this.agencyClient) return Promise.resolve(null);
    return this.agencyClient.create({
      data: {
        id: newId(),
        name: input.name,
        website: input.website || null,
        city: input.city ?? null,
        teamSize: input.teamSize ?? null,
        personId: input.personId ?? personId ?? null,
      },
      include: agencyInclude,
    });
  }

  update(id: string, input: AgencyUpdateInput) {
    if (!this.agencyClient) return Promise.resolve(null);
    return this.agencyClient.update({
      where: { id },
      data: {
        name: input.name,
        website: input.website === '' ? null : input.website,
        city: input.city,
        teamSize: input.teamSize,
        personId: input.personId,
      },
      include: agencyInclude,
    });
  }

  countManagedArtists(agencyId: string) {
    return this.prisma.client.relationship.count({
      where: managedArtistsWhere('Agency', agencyId, MANAGES_RELATIONSHIP),
    });
  }

  listManagedArtists(agencyId: string) {
    return this.prisma.client.relationship.findMany({
      where: managedArtistsWhere('Agency', agencyId, MANAGES_RELATIONSHIP),
      orderBy: { createdAt: 'desc' },
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
