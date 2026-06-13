import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { parseSchema } from '../../common/validation/parse-schema';
import { ApiKeyAuthGuard } from '../public-api/api-key-auth.guard';
import { PartnerIngestBodySchema, PartnerSlugParamSchema } from './schema';
import { ExchangePartnerService } from './data-export.service';

@Controller('exchange/partners')
export class ExchangePartnerController {
  constructor(private readonly partnerService: ExchangePartnerService) {}

  @Post(':slug/ingest')
  @UseGuards(ApiKeyAuthGuard)
  ingest(@Param() params: Record<string, string>, @Body() body: unknown) {
    const { slug } = parseSchema(PartnerSlugParamSchema, params);
    const parsed = parseSchema(PartnerIngestBodySchema, body);
    return this.partnerService.ingest(slug, parsed);
  }

  @Get(':slug/status')
  status(@Param() params: Record<string, string>) {
    const { slug } = parseSchema(PartnerSlugParamSchema, params);
    return this.partnerService.getStatus(slug);
  }
}
