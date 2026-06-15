import { BadRequestException, Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import {
  assertOrgManage,
  assertOrgRead,
  requireOrganization,
} from '../../common/org/org-access';
import type { OrganizationCreateInput } from './dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ctx: MembershipContext, limit = 50) {
    const orgIds = ctx.organizationMemberships.map((m) => m.organizationId);
    if (!orgIds.length && !ctx.roles.includes('admin')) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    const rows = await this.prisma.client.organization.findMany({
      where: ctx.roles.includes('admin') ? undefined : { id: { in: orgIds } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        type: row.type,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(input: OrganizationCreateInput, ctx: MembershipContext) {
    if (!ctx.personId) {
      throw new BadRequestException('Person required');
    }

    const baseSlug = input.slug ?? slugify(input.name);
    let slug = baseSlug;
    let suffix = 0;
    while (
      await this.prisma.client.organization.findUnique({ where: { slug } })
    ) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const org = await this.prisma.client.organization.create({
      data: {
        id: newId(),
        name: input.name,
        slug,
        type: input.type ?? null,
        metadata: (input.metadata ?? {}) as object,
        members: {
          create: {
            id: newId(),
            personId: ctx.personId,
            role: 'ORG_OWNER',
          },
        },
      },
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      createdAt: org.createdAt.toISOString(),
    };
  }

  async getById(id: string, ctx: MembershipContext) {
    const org = await requireOrganization(this.prisma, id);
    assertOrgRead(ctx, id);
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      metadata: org.metadata,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }
}
