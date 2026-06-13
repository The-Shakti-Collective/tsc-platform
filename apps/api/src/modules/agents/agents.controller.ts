import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  AgentRecommendationsQuerySchema,
  CareerAgentRunInputSchema,
  CommunityAgentRunInputSchema,
  EventAgentRunInputSchema,
  BrandMatchAgentRunInputSchema,
  OpportunityAgentRunInputSchema,
  TalentDiscoveryAgentRunInputSchema,
  TalentDiscoveryAlertsQuerySchema,
  ForecastAgentRunInputSchema,
  InsightsFeedQuerySchema,
  CopilotQueryInputSchema,
  CopilotFeedbackInputSchema,
  AutonomousWorkflowRunInputSchema,
  AutonomousWorkflowApproveInputSchema,
} from '@tsc/contracts/agents';
import {
  OpportunityGenerationApproveInputSchema,
  OpportunityGenerationDraftsQuerySchema,
  OpportunityGenerationRunInputSchema,
  OpportunityGenerationSignalsQuerySchema,
} from '@tsc/contracts/opportunity-generation';
import { DecisionEngineService } from './decision-engine.service';
import { OpportunityAgentService } from './opportunity-agent.service';
import { CareerAgentService } from './career-agent.service';
import { CommunityAgentService } from './community-agent.service';
import { EventAgentService } from './event-agent.service';
import { BrandMatchAgentService } from './brand-match-agent.service';
import { TalentDiscoveryAgentService } from './talent-discovery-agent.service';
import { ForecastAgentService } from './forecast-agent.service';
import { CopilotAgentService } from './copilot-agent.service';
import { AutonomousWorkflowService } from './autonomous-workflow.service';
import { OpportunityGenerationService } from './opportunity-generation.service';

@Controller('agents')
@UseGuards(ClerkAuthGuard)
export class AgentsController {
  constructor(
    private readonly decisionEngine: DecisionEngineService,
    private readonly opportunityAgent: OpportunityAgentService,
  ) {}

  @Post('decisions/:id/approve')
  approveDecision(@Param('id') id: string) {
    return this.decisionEngine.approveDecision(id);
  }

  @Post('decisions/:id/reject')
  rejectDecision(@Param('id') id: string) {
    return this.decisionEngine.rejectDecision(id);
  }

  @Get('recommendations/for-me')
  recommendationsForMe(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityAgent.getRecommendationsForMe(
      ctx,
      parseSchema(AgentRecommendationsQuerySchema, query),
    );
  }

  @Get('recommendations/artist/:artistId')
  recommendationsForArtist(
    @Param('artistId') artistId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityAgent.getRecommendationsForArtist(
      artistId,
      parseSchema(AgentRecommendationsQuerySchema, query),
      ctx,
    );
  }
}

@Controller('agents/opportunity')
@UseGuards(ClerkAuthGuard)
export class OpportunityAgentController {
  constructor(private readonly opportunityAgent: OpportunityAgentService) {}

  @Post('run')
  run(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.opportunityAgent.run(
      parseSchema(OpportunityAgentRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Get('recommendations/:artistId')
  listRecommendations(
    @Param('artistId') artistId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityAgent.getRecommendationsForArtist(
      artistId,
      parseSchema(AgentRecommendationsQuerySchema, query),
      ctx,
    );
  }
}

@Controller('agents/career')
@UseGuards(ClerkAuthGuard)
export class CareerAgentController {
  constructor(private readonly careerAgent: CareerAgentService) {}

  @Post('run/:artistId')
  run(
    @Param('artistId') artistId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.careerAgent.run(
      artistId,
      parseSchema(CareerAgentRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Get('actions/:artistId')
  listActions(
    @Param('artistId') artistId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.careerAgent.listActions(
      artistId,
      parseSchema(AgentRecommendationsQuerySchema, query),
      ctx,
    );
  }

  @Post('actions/:id/dismiss')
  dismissAction(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.careerAgent.dismissAction(id, ctx);
  }

  @Get('dashboard/:artistId')
  dashboard(@Param('artistId') artistId: string, @Membership() ctx: MembershipContext) {
    return this.careerAgent.getDashboard(artistId, ctx);
  }
}

@Controller('agents/community')
@UseGuards(ClerkAuthGuard)
export class CommunityAgentController {
  constructor(private readonly communityAgent: CommunityAgentService) {}

  @Post('run/:communityId')
  run(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.communityAgent.run(
      communityId,
      parseSchema(CommunityAgentRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Get('suggestions/:communityId')
  listSuggestions(
    @Param('communityId') communityId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.communityAgent.listSuggestions(
      communityId,
      parseSchema(AgentRecommendationsQuerySchema, query),
      ctx,
    );
  }

  @Post('suggestions/:id/approve')
  approveSuggestion(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.communityAgent.approveSuggestion(id, ctx);
  }

  @Post('suggestions/:id/dismiss')
  dismissSuggestion(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.communityAgent.dismissSuggestion(id, ctx);
  }
}

@Controller('agents/event')
@UseGuards(ClerkAuthGuard)
export class EventAgentController {
  constructor(private readonly eventAgent: EventAgentService) {}

  @Post('run/:eventId')
  run(
    @Param('eventId') eventId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.eventAgent.run(
      eventId,
      parseSchema(EventAgentRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Get('insights/:eventId')
  getInsights(
    @Param('eventId') eventId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.eventAgent.getInsights(
      eventId,
      parseSchema(AgentRecommendationsQuerySchema, query),
      ctx,
    );
  }

  @Post('suggestions/:id/approve')
  approveSuggestion(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.eventAgent.approveSuggestion(id, ctx);
  }

  @Post('suggestions/:id/dismiss')
  dismissSuggestion(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.eventAgent.dismissSuggestion(id, ctx);
  }
}

@Controller('agents/brand-match')
@UseGuards(ClerkAuthGuard)
export class BrandMatchAgentController {
  constructor(private readonly brandMatchAgent: BrandMatchAgentService) {}

  @Post('run')
  run(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.brandMatchAgent.run(
      parseSchema(BrandMatchAgentRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Get('results/:brandId')
  getResults(
    @Param('brandId') brandId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.brandMatchAgent.getResults(
      brandId,
      parseSchema(AgentRecommendationsQuerySchema, query),
      ctx,
    );
  }

  @Post('results/:recommendationId/invite')
  inviteArtist(
    @Param('recommendationId') recommendationId: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.brandMatchAgent.inviteArtist(recommendationId, ctx);
  }

  @Get('campaigns/:brandId')
  getCampaignHistory(@Param('brandId') brandId: string, @Membership() ctx: MembershipContext) {
    return this.brandMatchAgent.getCampaignHistory(brandId, ctx);
  }
}

@Controller('agents/talent-discovery')
@UseGuards(ClerkAuthGuard)
export class TalentDiscoveryAgentController {
  constructor(private readonly talentDiscoveryAgent: TalentDiscoveryAgentService) {}

  @Post('run')
  run(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.talentDiscoveryAgent.run(
      parseSchema(TalentDiscoveryAgentRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Get('alerts')
  listAlerts(@Query() query: Record<string, unknown>, @Membership() ctx: MembershipContext) {
    return this.talentDiscoveryAgent.getAlerts(
      parseSchema(TalentDiscoveryAlertsQuerySchema, query),
      ctx,
    );
  }

  @Post('alerts/:id/acknowledge')
  acknowledgeAlert(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.talentDiscoveryAgent.acknowledgeAlert(id, ctx);
  }

  @Get('emerging-cities')
  emergingCities(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const limit = Number(query.limit ?? 10);
    return this.talentDiscoveryAgent.getEmergingCities(
      Number.isFinite(limit) ? Math.min(30, Math.max(1, limit)) : 10,
      ctx,
    );
  }

  @Get('fast-growing-artists')
  fastGrowingArtists(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const limit = Number(query.limit ?? 20);
    return this.talentDiscoveryAgent.getFastGrowingArtists(
      Number.isFinite(limit) ? Math.min(50, Math.max(1, limit)) : 20,
      ctx,
    );
  }
}

@Controller('agents/forecast')
@UseGuards(ClerkAuthGuard)
export class ForecastAgentController {
  constructor(private readonly forecastAgent: ForecastAgentService) {}

  @Post('run')
  run(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.forecastAgent.run(
      parseSchema(ForecastAgentRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Get('platform')
  platformRollup(@Membership() ctx: MembershipContext) {
    return this.forecastAgent.getPlatformRollup(ctx);
  }

  @Get(':entityType/:entityId')
  entityForecasts(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.forecastAgent.getEntityForecasts(entityType, entityId, ctx);
  }
}

@Controller('agents/copilot')
@UseGuards(ClerkAuthGuard)
export class CopilotAgentController {
  constructor(private readonly copilotAgent: CopilotAgentService) {}

  @Post('query')
  query(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.copilotAgent.query(parseSchema(CopilotQueryInputSchema, body ?? {}), ctx);
  }

  @Get('suggestions')
  suggestions() {
    return this.copilotAgent.getSuggestions();
  }

  @Post('feedback')
  feedback(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.copilotAgent.recordFeedback(
      parseSchema(CopilotFeedbackInputSchema, body ?? {}),
      ctx,
    );
  }
}

@Controller('agents/insights')
@UseGuards(ClerkAuthGuard)
export class InsightsController {
  constructor(private readonly forecastAgent: ForecastAgentService) {}

  @Get()
  list(@Query() query: Record<string, unknown>, @Membership() ctx: MembershipContext) {
    return this.forecastAgent.getInsights(parseSchema(InsightsFeedQuerySchema, query), ctx);
  }

  @Post(':id/actions/:actionType')
  executeAction(
    @Param('id') id: string,
    @Param('actionType') actionType: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.forecastAgent.executeInsightAction(id, actionType, ctx);
  }
}

@Controller('agents/workflows')
@UseGuards(ClerkAuthGuard)
export class AutonomousWorkflowController {
  constructor(private readonly workflowService: AutonomousWorkflowService) {}

  @Get()
  catalog(@Membership() ctx: MembershipContext) {
    return this.workflowService.getCatalog(ctx);
  }

  @Post('run')
  run(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.workflowService.runWorkflow(
      parseSchema(AutonomousWorkflowRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Get('runs/:id')
  getRun(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.workflowService.getRun(id, ctx);
  }

  @Post('runs/:id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.workflowService.approveRun(
      id,
      parseSchema(AutonomousWorkflowApproveInputSchema, body ?? {}),
      ctx,
    );
  }

  @Post('runs/:id/cancel')
  cancel(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.workflowService.cancelRun(id, ctx);
  }
}

@Controller('agents/opportunity-generation')
@UseGuards(ClerkAuthGuard)
export class OpportunityGenerationController {
  constructor(private readonly generationService: OpportunityGenerationService) {}

  @Post('run')
  run(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.generationService.run(
      parseSchema(OpportunityGenerationRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Get('drafts')
  listDrafts(@Query() query: Record<string, unknown>, @Membership() ctx: MembershipContext) {
    return this.generationService.listDrafts(
      parseSchema(OpportunityGenerationDraftsQuerySchema, query),
      ctx,
    );
  }

  @Get('signals')
  getSignals(@Query() query: Record<string, unknown>, @Membership() ctx: MembershipContext) {
    return this.generationService.getSignals(
      parseSchema(OpportunityGenerationSignalsQuerySchema, query),
      ctx,
    );
  }

  @Post('drafts/:id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.generationService.approveDraft(
      id,
      parseSchema(OpportunityGenerationApproveInputSchema, body ?? {}),
      ctx,
    );
  }

  @Post('drafts/:id/dismiss')
  dismiss(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.generationService.dismissDraft(id, ctx);
  }
}
