import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import type { RoyaltyStatementCreateInput } from './schema';
@Injectable()
export class RoyaltiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listRoyalties(releaseId?: string, limit = 25) {
    return this.prisma.client.royalty.findMany({
      where: releaseId ? { releaseId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { release: { select: { id: true, title: true, artistId: true } } },
    });
  }

  listStatements(organizationId: string, artistId?: string, limit = 25) {
    return this.prisma.client.royaltyStatement.findMany({
      where: {
        organizationId,
        ...(artistId ? { artistId } : {}),
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
      include: { lineItems: true, artist: { select: { id: true, name: true, slug: true } } },
    });
  }

  findStatementById(id: string) {
    return this.prisma.client.royaltyStatement.findUnique({
      where: { id },
      include: { lineItems: true, artist: { select: { id: true, name: true, slug: true } } },
    });
  }

  createStatement(data: RoyaltyStatementCreateInput) {
    const { lineItems, ...statement } = data;
    return this.prisma.client.royaltyStatement.create({
      data: {
        organizationId: statement.organizationId,
        artistId: statement.artistId,
        periodStart: statement.periodStart,
        periodEnd: statement.periodEnd,
        currency: statement.currency,
        grossAmount: statement.grossAmount,
        netAmount: statement.netAmount,
        source: statement.source,
        lineItems: lineItems?.length
          ? {
              create: lineItems.map((item) => ({
                title: item.title,
                platform: item.platform,
                streams: item.streams,
                amount: item.amount,
                currency: item.currency,
              })),
            }
          : undefined,
      },
      include: { lineItems: true },
    });
  }
}