import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { parseSchema } from '../../common/validation/parse-schema';
import { ApiKeyAuthGuard, RequireApiScope } from './api-key-auth.guard';
import {
  PublicArtistListQuerySchema,
  PublicCommunityListQuerySchema,
  PublicEventListQuerySchema,
  PublicOpportunityListQuerySchema,
  PublicVenueListQuerySchema,
  TscIdentityPublicParamSchema,
} from './schema';
import { PublicApiService } from './public-api.service';

@Controller('public/v1')
@UseGuards(ApiKeyAuthGuard)
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('artists')
  @RequireApiScope('read:artists')
  listArtists(@Query() query: Record<string, unknown>) {
    return this.publicApiService.listArtists(parseSchema(PublicArtistListQuerySchema, query));
  }

  @Get('artists/:id')
  @RequireApiScope('read:artists')
  getArtist(@Param('id') id: string) {
    return this.publicApiService.getArtist(id);
  }

  @Get('communities')
  @RequireApiScope('read:communities')
  listCommunities(@Query() query: Record<string, unknown>) {
    return this.publicApiService.listCommunities(
      parseSchema(PublicCommunityListQuerySchema, query),
    );
  }

  @Get('opportunities')
  @RequireApiScope('read:opportunities')
  listOpportunities(@Query() query: Record<string, unknown>) {
    return this.publicApiService.listOpportunities(
      parseSchema(PublicOpportunityListQuerySchema, query),
    );
  }

  @Get('events')
  @RequireApiScope('read:events')
  listEvents(@Query() query: Record<string, unknown>) {
    return this.publicApiService.listEvents(parseSchema(PublicEventListQuerySchema, query));
  }

  @Get('venues')
  @RequireApiScope('read:venues')
  listVenues(@Query() query: Record<string, unknown>) {
    return this.publicApiService.listVenues(parseSchema(PublicVenueListQuerySchema, query));
  }

  @Get('analytics/summary')
  @RequireApiScope('read:analytics')
  analyticsSummary() {
    return this.publicApiService.analyticsSummary();
  }

  @Get('identity/:namespace/:slug')
  @RequireApiScope('read:identity')
  resolveIdentity(
    @Param('namespace') namespace: string,
    @Param('slug') slug: string,
  ) {
    const parsed = parseSchema(TscIdentityPublicParamSchema, { namespace, slug });
    return this.publicApiService.resolveIdentity(parsed.namespace, parsed.slug);
  }
}
