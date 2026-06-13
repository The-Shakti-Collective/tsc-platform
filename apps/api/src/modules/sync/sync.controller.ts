import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { SyncMappingQuerySchema, SyncEventsRequestSchema } from './schema';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(ClerkAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /** Webhook-style ingest from CoreKnot (or TSC outbound replay). */
  @Post('events')
  ingestEvents(@Body() body: unknown) {
    return this.syncService.ingestEvents(parseSchema(SyncEventsRequestSchema, body));
  }

  /** Resolve external id → TSC entity id(s). */
  @Get('mappings')
  getMappings(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(SyncMappingQuerySchema, query);
    return this.syncService.getMapping(
      parsed.sourceSystem,
      parsed.externalId,
      parsed.tscEntityType,
    );
  }
}
