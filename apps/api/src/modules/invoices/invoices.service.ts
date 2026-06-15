import { ForbiddenException, Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { canManageArtist } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import type { InvoiceCreateInput } from './dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    ctx: MembershipContext,
    filters: { artistId?: string; status?: string; limit?: number },
  ) {
    const artistIds = filters.artistId
      ? [filters.artistId]
      : ctx.artistMemberships;

    if (!artistIds.length && !ctx.roles.includes('admin')) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    const rows = await this.prisma.client.invoice.findMany({
      where: {
        ...(ctx.roles.includes('admin')
          ? filters.artistId
            ? { artistId: filters.artistId }
            : {}
          : { artistId: { in: artistIds } }),
        ...(filters.status ? { status: filters.status as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });

    return {
      items: rows.map((row) => ({
        id: row.id,
        artistId: row.artistId,
        dealId: row.dealId,
        contractId: row.contractId,
        amount: row.amount != null ? Number(row.amount) : null,
        currency: row.currency,
        status: row.status,
        dueDate: row.dueDate?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(input: InvoiceCreateInput, ctx: MembershipContext) {
    if (!canManageArtist(ctx, input.artistId) && !ctx.roles.includes('admin')) {
      throw new ForbiddenException('Artist manage access required');
    }

    const row = await this.prisma.client.invoice.create({
      data: {
        id: newId(),
        artistId: input.artistId,
        dealId: input.dealId ?? null,
        contractId: input.contractId ?? null,
        bookingRequestId: input.bookingRequestId ?? null,
        brandId: input.brandId ?? null,
        amount: input.amount ?? null,
        currency: input.currency ?? 'INR',
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: 'draft',
      },
    });

    return {
      id: row.id,
      artistId: row.artistId,
      status: row.status,
      amount: row.amount != null ? Number(row.amount) : null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
