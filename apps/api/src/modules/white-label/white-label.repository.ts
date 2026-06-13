import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  MANAGES_RELATIONSHIP,
  managedArtistsWhere,
  parseWhiteLabelConfig,
  whiteLabelTenantInclude,
  whiteLabelTenantWhere,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type WhiteLabelTenantRow = {
  id: string;
  slug: string;
  name: string;
  type: string;
  customDomain: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  config: unknown;
  apiKeyId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class WhiteLabelRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(field: string): unknown {
    return (this.prisma.client as unknown as Record<string, unknown>)[field] ?? null;
  }

  isAvailable(): boolean {
    return this.client('whiteLabelTenant') != null;
  }

  findBySlug(slug: string) {
    const tenant = this.client('whiteLabelTenant') as {
      findFirst: (args: unknown) => Promise<WhiteLabelTenantRow | null>;
    } | null;
    if (!tenant) return Promise.resolve(null);
    return tenant.findFirst({
      where: whiteLabelTenantWhere(slug),
      include: whiteLabelTenantInclude,
    });
  }

  create(input: {
    slug: string;
    name: string;
    type: string;
    customDomain?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    config?: Prisma.InputJsonValue;
    apiKeyId?: string | null;
    isActive?: boolean;
  }) {
    const tenant = this.client('whiteLabelTenant') as {
      create: (args: unknown) => Promise<WhiteLabelTenantRow>;
    } | null;
    if (!tenant) return Promise.resolve(null);
    return tenant.create({
      data: {
        id: newId(),
        slug: input.slug,
        name: input.name,
        type: input.type,
        customDomain: input.customDomain ?? null,
        logoUrl: input.logoUrl ?? null,
        primaryColor: input.primaryColor ?? null,
        config: input.config ?? {},
        apiKeyId: input.apiKeyId ?? null,
        isActive: input.isActive ?? true,
      },
      include: whiteLabelTenantInclude,
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

  parseConfig(value: unknown) {
    return parseWhiteLabelConfig(value);
  }
}
