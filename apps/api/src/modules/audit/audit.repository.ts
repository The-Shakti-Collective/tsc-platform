import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database/client';
import { PrismaService } from '../../common/database/prisma.service';
import type { RecordAuditLogInput, AuditLogListQuery } from './schema';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(query: AuditLogListQuery) {
    return this.prisma.client.auditLog.findMany({
      where: this.buildWhere(query),
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      include: {
        actor: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  listForOrganizations(organizationIds: string[], query: AuditLogListQuery) {
    return this.prisma.client.auditLog.findMany({
      where: {
        organizationId: { in: organizationIds },
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      include: {
        actor: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  private buildWhere(query: AuditLogListQuery) {
    return {
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
    };
  }

  create(data: RecordAuditLogInput) {
    return this.prisma.client.auditLog.create({
      data: {
        organizationId: data.organizationId,
        actorPersonId: data.actorPersonId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        changes: (data.changes ?? {}) as Prisma.InputJsonValue,
      },
    });
  }
}