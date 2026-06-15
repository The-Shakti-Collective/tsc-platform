import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { AuditLogCreateSchema, AuditLogListQuerySchema } from './schema';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'List audit log entries' })
  listLogs(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.auditService.listLogs(
      parseSchema(AuditLogListQuerySchema, query),
      ctx,
    );
  }

  @Post('logs')
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Record an audit log entry' })
  record(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.auditService.record(parseSchema(AuditLogCreateSchema, body), ctx);
  }
}
