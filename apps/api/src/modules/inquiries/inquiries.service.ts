import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { assertOrgManage, assertOrgRead } from '../../common/org/org-access';
import type { InquiryCreateInput } from './dto';

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    organizationId: string,
    ctx: MembershipContext,
    filters: { status?: string; limit?: number },
  ) {
    assertOrgRead(ctx, organizationId);
    const rows = await this.prisma.client.inquiry.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });
    return {
      organizationId,
      items: rows.map((row) => ({
        id: row.id,
        subject: row.subject,
        status: row.status,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        artistId: row.artistId,
        createdAt: row.createdAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async createWebsiteContact(input: {
    name: string;
    email: string;
    interest: string;
    message: string;
  }) {
    const organizationId = process.env.TSC_DEFAULT_ORG_ID?.trim();
    if (!organizationId) {
      throw new ServiceUnavailableException('TSC_DEFAULT_ORG_ID is not configured');
    }

    const subject =
      input.interest.trim().length > 0
        ? `Website: ${input.interest}`
        : `Website contact from ${input.name}`;

    const row = await this.prisma.client.inquiry.create({
      data: {
        id: newId(),
        organizationId,
        subject,
        body: input.message,
        contactName: input.name,
        contactEmail: input.email,
        status: 'open',
      },
    });

    return {
      id: row.id,
      organizationId: row.organizationId,
      subject: row.subject,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(input: InquiryCreateInput, ctx: MembershipContext) {
    assertOrgManage(ctx, input.organizationId);
    const row = await this.prisma.client.inquiry.create({
      data: {
        id: newId(),
        organizationId: input.organizationId,
        subject: input.subject,
        body: input.body ?? null,
        contactName: input.contactName ?? null,
        contactEmail: input.contactEmail ?? null,
        artistId: input.artistId ?? null,
        assignedPersonId: input.assignedPersonId ?? null,
      },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      subject: row.subject,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
