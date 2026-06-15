import { ForbiddenException, Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { isAdmin } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import type { NotificationCreateInput } from './dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ctx: MembershipContext, filters: { unreadOnly?: boolean; limit?: number }) {
    if (!ctx.personId) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    const rows = await this.prisma.client.notification.findMany({
      where: {
        recipientPersonId: ctx.personId,
        ...(filters.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });

    return {
      items: rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        readAt: row.readAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(input: NotificationCreateInput, ctx: MembershipContext) {
    if (!isAdmin(ctx)) {
      throw new ForbiddenException('Admin access required to create notifications');
    }

    const row = await this.prisma.client.notification.create({
      data: {
        id: newId(),
        recipientPersonId: input.recipientPersonId,
        organizationId: input.organizationId ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
      },
    });

    return {
      id: row.id,
      recipientPersonId: row.recipientPersonId,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
