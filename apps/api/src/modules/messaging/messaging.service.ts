import { ForbiddenException, Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { assertOrgRead } from '../../common/org/org-access';
import type { MessageCreateInput } from './dto';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async listThread(
    threadId: string,
    ctx: MembershipContext,
    limit = 50,
  ) {
    const rows = await this.prisma.client.message.findMany({
      where: { threadId },
      orderBy: { sentAt: 'asc' },
      take: limit,
    });

    if (rows[0]?.organizationId) {
      assertOrgRead(ctx, rows[0].organizationId);
    }

    return {
      threadId,
      items: rows.map((row) => ({
        id: row.id,
        senderPersonId: row.senderPersonId,
        body: row.body,
        sentAt: row.sentAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async send(input: MessageCreateInput, ctx: MembershipContext) {
    if (!ctx.personId) {
      throw new ForbiddenException('Person required to send messages');
    }
    if (input.organizationId) {
      assertOrgRead(ctx, input.organizationId);
    }

    const row = await this.prisma.client.message.create({
      data: {
        id: newId(),
        organizationId: input.organizationId ?? null,
        threadId: input.threadId,
        senderPersonId: ctx.personId,
        body: input.body,
      },
    });

    return {
      id: row.id,
      threadId: row.threadId,
      sentAt: row.sentAt.toISOString(),
    };
  }
}
