import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { CoreknotCompatGuard } from '../../common/guards/coreknot-compat.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { CrmService } from '../crm/crm.service';
import { CoreknotContextService } from './coreknot-context.service';
import {
  emptyCrmConfig,
  emptyCrmStats,
  toLegacyLead,
  toLegacyLeadList,
} from './coreknot-compat.mappers';

/** CoreKnot client compat — flat `/api/crm/*` (Express CRM proxy paths). */
@Controller('crm')
@UseGuards(CoreknotCompatGuard, ClerkAuthGuard)
export class CrmLegacyController {
  constructor(
    private readonly crmService: CrmService,
    private readonly context: CoreknotContextService,
  ) {}

  @Get('leads')
  async listLeads(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const organizationId = this.context.resolveOrganizationId(ctx);
    const payload = await this.crmService.listLeads(organizationId, ctx, {
      stage: typeof query.stage === 'string' ? query.stage : undefined,
      limit: query.limit != null ? Number(query.limit) : 100,
    });
    return toLegacyLeadList(payload);
  }

  @Post('leads')
  async createLead(@Body() body: Record<string, unknown>, @Membership() ctx: MembershipContext) {
    const organizationId = this.context.resolveOrganizationId(ctx);
    const created = await this.crmService.createLead(
      {
        organizationId,
        name: String(body.name ?? 'Untitled lead'),
        email: typeof body.email === 'string' ? body.email : undefined,
        phone: typeof body.phone === 'string' ? body.phone : undefined,
        source: typeof body.source === 'string' ? body.source : undefined,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
        stage:
          typeof body.stage === 'string'
            ? (body.stage as 'new')
            : typeof body.leadStatus === 'string'
              ? (body.leadStatus.toLowerCase() as 'new')
              : undefined,
        assignedPersonId:
          typeof body.assignedPersonId === 'string' ? body.assignedPersonId : undefined,
      },
      ctx,
    );
    return toLegacyLead(created);
  }

  @Get('leads/audit-logs')
  listAuditLogs() {
    return { logs: [], total: 0, page: 1, limit: 50 };
  }

  @Get('leads/:id')
  async getLead(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    const organizationId = this.context.resolveOrganizationId(ctx);
    const lead = await this.crmService.getLeadById(organizationId, id, ctx);
    return toLegacyLead(lead);
  }

  @Put('leads/:id')
  async updateLead(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const organizationId = this.context.resolveOrganizationId(ctx);
    const lead = await this.crmService.updateLead(organizationId, id, body, ctx);
    return toLegacyLead(lead);
  }

  @Delete('leads/:id')
  deleteLead(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    const organizationId = this.context.resolveOrganizationId(ctx);
    return this.crmService.deleteLead(organizationId, id, ctx);
  }

  @Post('leads/:id/notes')
  async addNote(
    @Param('id') id: string,
    @Body() body: { text?: string },
    @Membership() ctx: MembershipContext,
  ) {
    const organizationId = this.context.resolveOrganizationId(ctx);
    const noteText = body.text?.trim();
    const lead = noteText
      ? await this.crmService.updateLead(
          organizationId,
          id,
          { notes: noteText },
          ctx,
        )
      : await this.crmService.getLeadById(organizationId, id, ctx);
    return toLegacyLead(lead);
  }

  @Post('leads/:id/lock-heartbeat')
  @HttpCode(204)
  lockHeartbeat() {
    return;
  }

  @Post('leads/:id/unlock')
  @HttpCode(204)
  unlock() {
    return;
  }

  @Get('leads/:leadId/audit')
  leadAudit() {
    return { entries: [] };
  }

  @Get('stats')
  stats(@Query('timeframe') timeframe?: string) {
    return { ...emptyCrmStats(), timeframe: timeframe ?? '7d' };
  }

  @Get('config')
  config() {
    return emptyCrmConfig();
  }

  @Get('imports')
  imports() {
    return { imports: [], total: 0 };
  }

  @Get('rep-summary')
  repSummary() {
    return { reps: [], totals: emptyCrmStats() };
  }

  @Get('followups')
  followups() {
    return { leads: [], total: 0, page: 1, limit: 50 };
  }

  @Post('unsubscribe')
  @HttpCode(200)
  unsubscribe() {
    return { ok: true, message: 'Unsubscribed' };
  }
}
