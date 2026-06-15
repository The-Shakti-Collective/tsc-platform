import { Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { assertOrgManage, assertOrgRead } from '../../common/org/org-access';
import type { GigCreateInput } from './dto';

@Injectable()
export class GigsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    organizationId: string,
    ctx: MembershipContext,
    filters: {
      artistId?: string;
      from?: string;
      to?: string;
      limit?: number;
    },
  ) {
    assertOrgRead(ctx, organizationId);
    const rows = await this.prisma.client.gig.findMany({
      where: {
        organizationId,
        ...(filters.artistId ? { artistId: filters.artistId } : {}),
        ...(filters.from || filters.to
          ? {
              startsAt: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { startsAt: 'asc' },
      take: filters.limit ?? 50,
    });
    return {
      organizationId,
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        artistId: row.artistId,
        venue: row.venue,
        city: row.city,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt?.toISOString() ?? null,
        status: row.status,
        fee: row.fee != null ? Number(row.fee) : null,
        currency: row.currency,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(input: GigCreateInput, ctx: MembershipContext) {
    assertOrgManage(ctx, input.organizationId);
    const row = await this.prisma.client.gig.create({
      data: {
        id: newId(),
        organizationId: input.organizationId,
        artistId: input.artistId ?? null,
        title: input.title,
        venue: input.venue ?? null,
        city: input.city ?? null,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        status: input.status ?? 'tentative',
        fee: input.fee ?? null,
        currency: input.currency ?? 'INR',
        notes: input.notes ?? null,
      },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      title: row.title,
      startsAt: row.startsAt.toISOString(),
      status: row.status,
    };
  }
}
