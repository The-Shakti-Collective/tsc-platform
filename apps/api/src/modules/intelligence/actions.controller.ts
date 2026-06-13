import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceActionSchema } from './schema';
import { CommandCenterV5ActionInputSchema } from '@tsc/contracts/agents';

@Controller('intelligence/actions')
@UseGuards(ClerkAuthGuard)
export class IntelligenceActionsController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Post('create-campaign')
  createCampaign(@Body() body: unknown) {
    return this.intelligenceService.runIntelligenceAction(
      'create-campaign',
      parseSchema(IntelligenceActionSchema, body ?? {}),
    );
  }

  @Post('invite-artists')
  inviteArtists(@Body() body: unknown) {
    return this.intelligenceService.runIntelligenceAction(
      'invite-artists',
      parseSchema(IntelligenceActionSchema, body ?? {}),
    );
  }

  @Post('launch-opportunity')
  launchOpportunity(@Body() body: unknown) {
    return this.intelligenceService.runIntelligenceAction(
      'launch-opportunity',
      parseSchema(IntelligenceActionSchema, body ?? {}),
    );
  }

  @Post('contact-community')
  contactCommunity(@Body() body: unknown) {
    return this.intelligenceService.runIntelligenceAction(
      'contact-community',
      parseSchema(IntelligenceActionSchema, body ?? {}),
    );
  }

  @Post('review-pipeline-deals')
  reviewPipelineDeals(@Body() body: unknown) {
    return this.intelligenceService.runIntelligenceAction(
      'review-pipeline-deals',
      parseSchema(IntelligenceActionSchema, body ?? {}),
    );
  }

  @Post('launch-brand-campaign')
  launchBrandCampaign(@Body() body: unknown) {
    return this.intelligenceService.runIntelligenceAction(
      'launch-brand-campaign',
      parseSchema(IntelligenceActionSchema, body ?? {}),
    );
  }

  @Post('contact-at-risk-artists')
  contactAtRiskArtists(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.intelligenceService.runCommandCenterV5Action(
      'review-recovery-plan',
      parseSchema(CommandCenterV5ActionInputSchema, body ?? {}),
      ctx,
    );
  }

  @Post('review-recovery-plan')
  reviewRecoveryPlan(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.intelligenceService.runCommandCenterV5Action(
      'review-recovery-plan',
      parseSchema(CommandCenterV5ActionInputSchema, body ?? {}),
      ctx,
    );
  }

  @Post('apply-recommended')
  applyRecommended(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.intelligenceService.runCommandCenterV5Action(
      'apply-recommended',
      parseSchema(CommandCenterV5ActionInputSchema, body ?? {}),
      ctx,
    );
  }

  @Post('launch-community-campaign')
  launchCommunityCampaign(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.intelligenceService.runCommandCenterV5Action(
      'launch-community-campaign',
      parseSchema(CommandCenterV5ActionInputSchema, body ?? {}),
      ctx,
    );
  }
}
