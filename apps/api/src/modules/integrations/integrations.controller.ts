import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  IntegrationConnectionCreateSchema,
  IntegrationListQuerySchema,
} from './schema';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(ClerkAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('oauth-readiness')
  @ApiOperation({ summary: 'Pre-flight OAuth credential check (admin/ops)' })
  getOAuthReadiness() {
    return this.integrationsService.getOAuthReadiness();
  }

  @Get('connections')
  @ApiOperation({ summary: 'List integration connections' })
  listConnections(@Query() query: Record<string, unknown>) {
    return this.integrationsService.listConnections(parseSchema(IntegrationListQuerySchema, query));
  }

  @Post('connections')
  @ApiOperation({ summary: 'Register integration connection stub' })
  createConnection(@Body() body: unknown) {
    return this.integrationsService.createConnection(
      parseSchema(IntegrationConnectionCreateSchema, body),
    );
  }
}
