import { Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { assertOrgManage, assertOrgRead } from '../../common/org/org-access';
import type { MarketplaceListingCreateInput } from './dto';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    ctx: MembershipContext,
    filters: {
      organizationId?: string;
      status?: string;
      limit?: number;
    },
  ) {
    if (filters.organizationId) {
      assertOrgRead(ctx, filters.organizationId);
    }

    const orgIds = ctx.organizationMemberships.map((m) => m.organizationId);
    const rows = await this.prisma.client.marketplaceListing.findMany({
      where: {
        ...(filters.organizationId
          ? { organizationId: filters.organizationId }
          : ctx.roles.includes('admin')
            ? {}
            : orgIds.length
              ? { organizationId: { in: orgIds } }
              : { status: 'active' }),
        ...(filters.status ? { status: filters.status as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });

    return {
      items: rows.map((row) => ({
        id: row.id,
        organizationId: row.organizationId,
        title: row.title,
        listingType: row.listingType,
        status: row.status,
        price: row.price != null ? Number(row.price) : null,
        currency: row.currency,
        opportunityId: row.opportunityId,
        createdAt: row.createdAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(input: MarketplaceListingCreateInput, ctx: MembershipContext) {
    if (input.organizationId) {
      assertOrgManage(ctx, input.organizationId);
    }

    const row = await this.prisma.client.marketplaceListing.create({
      data: {
        id: newId(),
        organizationId: input.organizationId ?? null,
        title: input.title,
        description: input.description ?? null,
        listingType: input.listingType ?? null,
        price: input.price ?? null,
        currency: input.currency ?? 'INR',
        opportunityId: input.opportunityId ?? null,
        status: 'draft',
      },
    });

    return {
      id: row.id,
      title: row.title,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
