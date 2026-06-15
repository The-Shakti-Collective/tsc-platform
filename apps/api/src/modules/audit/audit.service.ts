import { ForbiddenException, Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { isAdmin } from '@tsc/permissions';
import {
  assertOrgManage,
  assertOrgRead,
} from '../../common/org/org-access';
import type { RecordAuditLogInput, AuditLogListQuery } from './schema';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async listLogs(query: AuditLogListQuery, ctx: MembershipContext) {
    if (query.organizationId) {
      assertOrgRead(ctx, query.organizationId);
      const items = await this.repository.list(query);
      return { items };
    }

    if (isAdmin(ctx)) {
      const items = await this.repository.list(query);
      return { items };
    }

    const orgIds = ctx.organizationMemberships.map((m) => m.organizationId);
    if (!orgIds.length) {
      return { items: [] };
    }

    const items = await this.repository.listForOrganizations(orgIds, query);
    return { items };
  }

  record(input: RecordAuditLogInput, ctx: MembershipContext) {
    if (input.organizationId) {
      assertOrgManage(ctx, input.organizationId);
    } else if (!isAdmin(ctx)) {
      throw new ForbiddenException('organizationId required for audit record');
    }

    return this.repository.create({
      ...input,
      actorPersonId: input.actorPersonId ?? ctx.personId,
    });
  }
}
