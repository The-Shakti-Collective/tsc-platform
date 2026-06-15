import { Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { assertOrgManage, assertOrgRead } from '../../common/org/org-access';
import type { TeamCreateInput } from './dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, ctx: MembershipContext, limit = 50) {
    assertOrgRead(ctx, organizationId);
    const rows = await this.prisma.client.organizationTeam.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return {
      organizationId,
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        leadPersonId: row.leadPersonId,
        createdAt: row.createdAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(input: TeamCreateInput, ctx: MembershipContext) {
    assertOrgManage(ctx, input.organizationId);
    const baseSlug = input.slug ?? slugify(input.name);
    const row = await this.prisma.client.organizationTeam.create({
      data: {
        id: newId(),
        organizationId: input.organizationId,
        name: input.name,
        slug: baseSlug,
        description: input.description ?? null,
        leadPersonId: input.leadPersonId ?? null,
      },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      slug: row.slug,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
