import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { parseSchema } from '../../common/validation/parse-schema';
import { ApiKeyAuthGuard, RequireApiScope } from '../public-api/api-key-auth.guard';
import {
  AnalyticsExportQuerySchema,
  BulkArtistExportQuerySchema,
  GraphExportParamSchema,
  GraphExportQuerySchema,
  RelationshipExportQuerySchema,
} from './schema';
import { DataExportService, GraphExportService } from './data-export.service';

@Controller('public/v1/export')
@UseGuards(ApiKeyAuthGuard)
export class PublicExportController {
  constructor(
    private readonly exportService: DataExportService,
    private readonly graphExportService: GraphExportService,
  ) {}

  @Get('artists')
  @RequireApiScope('read:export')
  async exportArtists(@Query() query: Record<string, unknown>, @Res() res: Response) {
    const parsed = parseSchema(BulkArtistExportQuerySchema, query);
    const result = await this.exportService.exportArtists(parsed);

    if (result.format === 'csv' && 'csv' in result) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="artists.csv"');
      return res.send(result.csv);
    }

    return res.json(result);
  }

  @Get('relationships')
  @RequireApiScope('read:export')
  exportRelationships(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(RelationshipExportQuerySchema, query);
    return this.graphExportService.exportRelationships(parsed.entityType, parsed.entityId);
  }

  @Get('analytics')
  @RequireApiScope('read:export')
  exportAnalytics(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(AnalyticsExportQuerySchema, query);
    const period =
      parsed.period ??
      `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`;
    return this.exportService.exportAnalytics(period);
  }
}

@Controller('public/v1/graph')
@UseGuards(ApiKeyAuthGuard)
export class PublicGraphExportController {
  constructor(private readonly graphExportService: GraphExportService) {}

  @Get('export/:entityType/:entityId')
  @RequireApiScope('read:graph')
  exportGraph(
    @Param() params: Record<string, string>,
    @Query() query: Record<string, unknown>,
  ) {
    const parsedParams = parseSchema(GraphExportParamSchema, params);
    const parsedQuery = parseSchema(GraphExportQuerySchema, query);
    return this.graphExportService.exportGraphJsonLd(
      parsedParams.entityType,
      parsedParams.entityId,
      parsedQuery.depth,
    );
  }
}
