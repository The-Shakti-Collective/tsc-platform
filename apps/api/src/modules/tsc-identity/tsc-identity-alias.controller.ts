import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  AdminIdentityVerifySchema,
  TscIdentityEntityParamSchema,
  TscIdentitySlugParamSchema,
} from './schema';
import { TscIdentityNetworkService } from './tsc-identity-network.service';

/** CoreKnot client compat — `/api/tsc-identity` maps to `/api/identity` + admin paths. */
@Controller('tsc-identity')
export class TscIdentityAliasController {
  constructor(private readonly networkService: TscIdentityNetworkService) {}

  @Get('person/:personId/network')
  getPersonNetwork(@Param('personId') personId: string) {
    return this.networkService.getPersonIdentityNetwork(personId);
  }

  @Post('admin/:entityType/:entityId/badges')
  @UseGuards(ClerkAuthGuard)
  setVerificationBadge(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(TscIdentityEntityParamSchema, { entityType, entityId });
    return this.networkService.setAdminVerificationBadge(
      params.entityType,
      params.entityId,
      parseSchema(AdminIdentityVerifySchema, body),
      ctx,
    );
  }

  @Get(':namespace/:slug/public')
  getPublicIdentity(
    @Param('namespace') namespace: string,
    @Param('slug') slug: string,
  ) {
    const parsed = parseSchema(TscIdentitySlugParamSchema, { namespace, slug });
    return this.networkService.getPublicIdentity(parsed.namespace, parsed.slug);
  }

  @Get(':entityType/:entityId/badges')
  getVerificationBadges(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const parsed = parseSchema(TscIdentityEntityParamSchema, { entityType, entityId });
    return this.networkService.getVerificationBadges(parsed.entityType, parsed.entityId);
  }
}
