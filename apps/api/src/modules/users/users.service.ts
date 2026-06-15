import { Injectable, NotFoundException } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { isAdmin } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import type { UserCreateInput } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ctx: MembershipContext, limit = 50) {
    if (!isAdmin(ctx)) {
      if (!ctx.personId) return { items: [], updatedAt: new Date().toISOString() };
      const self = await this.prisma.client.user.findUnique({
        where: { personId: ctx.personId },
      });
      return {
        items: self ? [this.toSummary(self)] : [],
        updatedAt: new Date().toISOString(),
      };
    }

    const rows = await this.prisma.client.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return {
      items: rows.map((row) => this.toSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(input: UserCreateInput, ctx: MembershipContext) {
    if (!isAdmin(ctx)) {
      throw new NotFoundException('Admin access required');
    }

    const row = await this.prisma.client.user.create({
      data: {
        id: newId(),
        clerkUserId: input.clerkUserId,
        personId: input.personId,
        platformRole: input.platformRole ?? 'TEAM_MEMBER',
      },
    });
    return this.toSummary(row);
  }

  async me(ctx: MembershipContext) {
    if (!ctx.personId) {
      throw new NotFoundException('Person not linked');
    }
    const row = await this.prisma.client.user.findUnique({
      where: { personId: ctx.personId },
    });
    if (!row) {
      return {
        clerkUserId: ctx.userId,
        personId: ctx.personId,
        platformRole: ctx.platformRole ?? 'TEAM_MEMBER',
        provisioned: false,
      };
    }
    return { ...this.toSummary(row), provisioned: true };
  }

  private toSummary(row: {
    id: string;
    clerkUserId: string;
    personId: string;
    platformRole: string;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      clerkUserId: row.clerkUserId,
      personId: row.personId,
      platformRole: row.platformRole,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
