import { Controller, Get, Param } from '@nestjs/common';
import { parseSchema } from '../../common/validation/parse-schema';
import { WhiteLabelTenantSlugParamSchema } from './schema';
import { WhiteLabelService } from './white-label.service';

@Controller('white-label/tenants')
export class WhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  @Get(':slug/config')
  getConfig(@Param('slug') slug: string) {
    const parsed = parseSchema(WhiteLabelTenantSlugParamSchema, { slug });
    return this.whiteLabelService.getPublicConfig(parsed.slug);
  }

  @Get(':slug/artists')
  listArtists(@Param('slug') slug: string) {
    const parsed = parseSchema(WhiteLabelTenantSlugParamSchema, { slug });
    return this.whiteLabelService.listTenantArtists(parsed.slug);
  }
}
