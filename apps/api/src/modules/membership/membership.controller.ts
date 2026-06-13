import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import {
  MembershipCreateSchema,
  MembershipPatchSchema,
} from '@tsc/contracts/membership-program';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { MembershipService } from './membership.service';

@Controller('communities')
@UseGuards(ClerkAuthGuard)
export class MembershipCommunityController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get(':id/memberships')
  listPrograms(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.membershipService.listCommunityPrograms(id, ctx);
  }

  @Post(':id/memberships')
  createProgram(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.membershipService.createProgram(
      id,
      parseSchema(MembershipCreateSchema, body),
      ctx,
    );
  }
}

@Controller('memberships')
@UseGuards(ClerkAuthGuard)
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get(':id')
  getProgram(@Param('id') id: string) {
    return this.membershipService.getProgram(id);
  }

  @Patch(':id')
  patchProgram(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.membershipService.patchProgram(
      id,
      parseSchema(MembershipPatchSchema, body),
      ctx,
    );
  }

  @Post(':id/subscribe')
  subscribe(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.membershipService.subscribe(id, ctx);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.membershipService.cancel(id, ctx);
  }
}

@Controller('fans')
@UseGuards(ClerkAuthGuard)
export class MembershipFanController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('me/memberships')
  listMySubscriptions(@Membership() ctx: MembershipContext) {
    return this.membershipService.listMySubscriptions(ctx);
  }
}
