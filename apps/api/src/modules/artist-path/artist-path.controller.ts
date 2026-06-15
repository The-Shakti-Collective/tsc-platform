import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { IpRateLimitGuard } from '../../common/rate-limit/ip-rate-limit.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { ArtistPathSecretGuard } from './artist-path-secret.guard';
import { ArtistPathService } from './artist-path.service';
import {
  ArtistPathApplicationListQuerySchema,
  ArtistPathApplicationSubmitSchema,
} from './dto';

@Controller('artist-path/applications')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class ArtistPathController {
  constructor(private readonly service: ArtistPathService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER', 'TEAM_MEMBER', 'CLIENT')
  list(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(ArtistPathApplicationListQuerySchema, query);
    return this.service.listApplications(ctx, {
      organizationId: parsed.organizationId,
      page: parsed.page,
      limit: parsed.limit,
      search: parsed.search,
    });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER', 'TEAM_MEMBER', 'CLIENT')
  getOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string | undefined,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.getApplicationDetail(id, ctx, organizationId);
  }
}

@Controller('public/artist-path')
export class PublicArtistPathController {
  constructor(private readonly service: ArtistPathService) {}

  @Post('applications')
  @UseGuards(ArtistPathSecretGuard, IpRateLimitGuard)
  submit(@Body() body: unknown) {
    const parsed = parseSchema(ArtistPathApplicationSubmitSchema, body);
    return this.service.submitPublicApplication(parsed);
  }
}
