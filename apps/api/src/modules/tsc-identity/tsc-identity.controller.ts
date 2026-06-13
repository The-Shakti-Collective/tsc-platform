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

@Controller('identity')
export class TscIdentityNetworkController {
  constructor(private readonly networkService: TscIdentityNetworkService) {}

  @Get('network/:personId')
  getPersonNetwork(@Param('personId') personId: string) {
    return this.networkService.getPersonIdentityNetwork(personId);
  }

  @Get('verify/badges/:entityType/:entityId')
  getVerificationBadges(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const parsed = parseSchema(TscIdentityEntityParamSchema, { entityType, entityId });
    return this.networkService.getVerificationBadges(parsed.entityType, parsed.entityId);
  }

  @Get(':namespace/:slug/public')
  getPublicIdentity(
    @Param('namespace') namespace: string,
    @Param('slug') slug: string,
  ) {
    const parsed = parseSchema(TscIdentitySlugParamSchema, { namespace, slug });
    return this.networkService.getPublicIdentity(parsed.namespace, parsed.slug);
  }
}

@Controller('admin/identity')
@UseGuards(ClerkAuthGuard)
export class AdminIdentityController {
  constructor(private readonly networkService: TscIdentityNetworkService) {}

  @Post('verify/:entityType/:entityId')
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
}
