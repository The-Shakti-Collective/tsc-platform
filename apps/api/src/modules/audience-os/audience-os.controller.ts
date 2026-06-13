import { Controller, Get, Param, Query } from '@nestjs/common';
import { parseSchema } from '../../common/validation/parse-schema';
import { AudienceOsService } from './audience-os.service';
import { AudienceOsQuerySchema } from './schema';

@Controller('audience-os')
export class AudienceOsController {
  constructor(private readonly audienceOsService: AudienceOsService) {}

  @Get('artists/:id/dashboard')
  getArtistDashboard(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(AudienceOsQuerySchema, query);
    return this.audienceOsService.getArtistDashboard(id, parsed.limit);
  }

  @Get('artists/:id/export')
  exportArtistDashboard(@Param('id') id: string) {
    return this.audienceOsService.exportArtistDashboard(id);
  }

  @Get('communities/:id/dashboard')
  getCommunityDashboard(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(AudienceOsQuerySchema, query);
    return this.audienceOsService.getCommunityDashboard(id, parsed.limit);
  }
}
