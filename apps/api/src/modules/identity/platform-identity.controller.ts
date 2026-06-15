import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { parseSchema } from '../../common/validation/parse-schema';
import { z } from 'zod';

const PlatformIdentityUpsertSchema = z.object({
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/** Platform Identity model (distinct from CreativeIdentity). */
@Controller('identity/platform')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class PlatformIdentityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async me(@Membership() ctx: MembershipContext) {
    if (!ctx.personId) {
      return { provisioned: false, personId: null };
    }
    const row = await this.prisma.client.identity.findUnique({
      where: { personId: ctx.personId },
    });
    if (!row) {
      return { provisioned: false, personId: ctx.personId };
    }
    return {
      provisioned: true,
      id: row.id,
      personId: row.personId,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      metadata: row.metadata,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  @Post('me')
  async upsertMe(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    if (!ctx.personId) {
      throw new BadRequestException('Person required');
    }
    const input = parseSchema(PlatformIdentityUpsertSchema, body);
    const row = await this.prisma.client.identity.upsert({
      where: { personId: ctx.personId },
      create: {
        id: newId(),
        personId: ctx.personId,
        displayName: input.displayName ?? null,
        avatarUrl: input.avatarUrl ?? null,
        metadata: (input.metadata ?? {}) as object,
      },
      update: {
        displayName: input.displayName ?? undefined,
        avatarUrl: input.avatarUrl ?? undefined,
        metadata: input.metadata ? (input.metadata as object) : undefined,
      },
    });
    return {
      id: row.id,
      personId: row.personId,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
