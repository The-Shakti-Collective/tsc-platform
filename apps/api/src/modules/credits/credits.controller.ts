import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  CreditEarnSchema,
  CreditHistoryQuerySchema,
} from '@tsc/contracts/credits';
import { CreditReferStubSchema } from '@tsc/contracts/rewards';
import { CreditsService } from './credits.service';

@Controller('credits')
@UseGuards(ClerkAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('me')
  getMyBalance(@Membership() ctx: MembershipContext) {
    return this.creditsService.getMyBalance(ctx);
  }

  @Get('me/history')
  getMyHistory(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(CreditHistoryQuerySchema, query);
    return this.creditsService.getMyHistory(ctx, parsed.limit);
  }

  @Post('earn')
  earn(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.creditsService.earn(parseSchema(CreditEarnSchema, body), ctx);
  }

  /** Stub: award +3 credits for sharing content (once per shareId). */
  @Post('stub/share')
  shareStub(@Membership() ctx: MembershipContext) {
    return this.creditsService.shareContentStub(ctx);
  }

  /** Stub: create REFERRED edge + award +15 credits (idempotent per referred person). */
  @Post('stub/refer')
  referStub(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    const parsed = parseSchema(CreditReferStubSchema, body);
    return this.creditsService.referMemberStub(parsed.referredPersonId, ctx);
  }
}
