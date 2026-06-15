import { Injectable, NotFoundException } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { assertOrgManage, assertOrgRead } from '../../common/org/org-access';
import type { LeadCreateInput } from './dto';

type LeadRow = {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: string;
  assignedPersonId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async listLeads(
    organizationId: string,
    ctx: MembershipContext,
    filters: { stage?: string; limit?: number },
  ) {
    assertOrgRead(ctx, organizationId);
    const rows = await this.prisma.client.lead.findMany({
      where: {
        organizationId,
        ...(filters.stage ? { stage: filters.stage as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });
    return {
      organizationId,
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        source: row.source,
        stage: row.stage,
        assignedPersonId: row.assignedPersonId,
        createdAt: row.createdAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async createLead(input: LeadCreateInput, ctx: MembershipContext) {
    assertOrgManage(ctx, input.organizationId);
    const row = await this.prisma.client.lead.create({
      data: {
        id: newId(),
        organizationId: input.organizationId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        source: input.source ?? null,
        stage: input.stage ?? 'new',
        assignedPersonId: input.assignedPersonId ?? null,
        notes: input.notes ?? null,
      },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      stage: row.stage,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getLeadById(organizationId: string, leadId: string, ctx: MembershipContext) {
    assertOrgRead(ctx, organizationId);
    const row = await this.prisma.client.lead.findFirst({
      where: { id: leadId, organizationId },
    });
    if (!row) {
      throw new NotFoundException('Lead not found');
    }
    return this.toLeadItem(row);
  }

  async updateLead(
    organizationId: string,
    leadId: string,
    body: Record<string, unknown>,
    ctx: MembershipContext,
  ) {
    assertOrgManage(ctx, organizationId);
    const existing = await this.prisma.client.lead.findFirst({
      where: { id: leadId, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    const row = await this.prisma.client.lead.update({
      where: { id: leadId },
      data: {
        ...(typeof body.name === 'string' ? { name: body.name } : {}),
        ...(typeof body.email === 'string' ? { email: body.email } : {}),
        ...(body.email === null ? { email: null } : {}),
        ...(typeof body.phone === 'string' ? { phone: body.phone } : {}),
        ...(body.phone === null ? { phone: null } : {}),
        ...(typeof body.source === 'string' ? { source: body.source } : {}),
        ...(typeof body.notes === 'string' ? { notes: body.notes } : {}),
        ...(typeof body.assignedPersonId === 'string'
          ? { assignedPersonId: body.assignedPersonId }
          : {}),
        ...(typeof body.stage === 'string' ? { stage: body.stage as never } : {}),
      },
    });

    return this.toLeadItem(row);
  }

  async deleteLead(organizationId: string, leadId: string, ctx: MembershipContext) {
    assertOrgManage(ctx, organizationId);
    const existing = await this.prisma.client.lead.findFirst({
      where: { id: leadId, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }
    await this.prisma.client.lead.delete({ where: { id: leadId } });
    return { message: `Lead "${existing.name}" permanently deleted.` };
  }

  private toLeadItem(row: LeadRow) {
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      source: row.source,
      stage: row.stage,
      assignedPersonId: row.assignedPersonId,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
