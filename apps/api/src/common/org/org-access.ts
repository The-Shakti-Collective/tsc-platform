import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { canAccessOrganization, canManageOrganization } from '@tsc/permissions';
import type { PrismaService } from '../database/prisma.service';

export async function requireOrganization(
  prisma: PrismaService,
  organizationId: string,
) {
  const org = await prisma.client.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) {
    throw new NotFoundException(`Organization ${organizationId} not found`);
  }
  return org;
}

export function assertOrgRead(ctx: MembershipContext, organizationId: string) {
  if (!canAccessOrganization(ctx, organizationId)) {
    throw new ForbiddenException('Organization access denied');
  }
}

export function assertOrgManage(ctx: MembershipContext, organizationId: string) {
  if (!canManageOrganization(ctx, organizationId)) {
    throw new ForbiddenException('Organization manage access denied');
  }
}
