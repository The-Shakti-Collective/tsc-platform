import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import {
  RewardCatalogQuerySchema,
  RewardRedemptionPatchSchema,
} from '@tsc/contracts/rewards';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  listCatalog(@Query() query: Record<string, unknown>) {
    return this.rewardsService.listCatalog(parseSchema(RewardCatalogQuerySchema, query));
  }

  @Get(':id')
  getReward(@Param('id') id: string) {
    return this.rewardsService.getReward(id);
  }

  @Post(':id/redeem')
  @UseGuards(ClerkAuthGuard)
  redeem(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.rewardsService.redeem(id, ctx);
  }
}

@Controller('fans')
@UseGuards(ClerkAuthGuard)
export class RewardsFanController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('me/redemptions')
  listMyRedemptions(@Membership() ctx: MembershipContext) {
    return this.rewardsService.listMyRedemptions(ctx);
  }
}

@Controller('admin/rewards/redemptions')
@UseGuards(ClerkAuthGuard)
export class RewardsAdminController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Patch(':id')
  patchRedemption(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.rewardsService.patchRedemption(
      id,
      parseSchema(RewardRedemptionPatchSchema, body),
      ctx,
    );
  }
}
