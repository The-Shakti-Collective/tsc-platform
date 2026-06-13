import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { GraphEntityType } from '@tsc/database';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { IntelligenceService } from './intelligence.service';
import {
  ArtistIdQuerySchema,
  CommandCenterQuerySchema,
  GraphEntityTypeSchema,
  PersonIdQuerySchema,
} from './schema';

@Controller('intelligence')
@UseGuards(ClerkAuthGuard)
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Get('opportunities/suggested')
  getSuggestedOpportunities(
    @Membership() ctx: MembershipContext,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(ArtistIdQuerySchema, query);
    return this.intelligenceService.getSuggestedOpportunities(parsed.artistId, ctx);
  }

  @Get('opportunities/scores')
  getOpportunityScores(@Membership() ctx: MembershipContext) {
    return this.intelligenceService.getOpportunityScores(ctx);
  }

  @Get('artists/:id/health')
  getArtistHealth(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.intelligenceService.getArtistHealth(id, ctx);
  }

  @Get('artists/:id/risk-alerts')
  getArtistRiskAlerts(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.intelligenceService.getArtistRiskAlerts(id, ctx);
  }

  @Get('fans/:personId/scores')
  getFanScores(@Param('personId') personId: string, @Membership() ctx: MembershipContext) {
    return this.intelligenceService.getFanScores(personId, ctx);
  }

  @Get('fans/:artistId/segments')
  getFanSegments(@Param('artistId') artistId: string, @Membership() ctx: MembershipContext) {
    return this.intelligenceService.getFanSegments(artistId, ctx);
  }

  @Get('cities/:city/recommendations')
  getCityRecommendations(@Param('city') city: string) {
    return this.intelligenceService.getCityRecommendations(city);
  }

  @Get('cities/:city')
  getCityIntelligence(@Param('city') city: string) {
    return this.intelligenceService.getCityIntelligence(city);
  }

  @Get('communities/:id/intelligence')
  getCommunityIntelligence(
    @Param('id') id: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.intelligenceService.getCommunityIntelligence(id, ctx);
  }

  @Get('recommendations/artists')
  getArtistRecommendations(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(PersonIdQuerySchema, query);
    return this.intelligenceService.getRecommendations('artists', parsed.personId, ctx);
  }

  @Get('recommendations/events')
  getEventRecommendations(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(PersonIdQuerySchema, query);
    return this.intelligenceService.getRecommendations('events', parsed.personId, ctx);
  }

  @Get('recommendations/workshops')
  getWorkshopRecommendations(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(PersonIdQuerySchema, query);
    return this.intelligenceService.getRecommendations('workshops', parsed.personId, ctx);
  }

  @Get('ecosystem/:entityType/:entityId/graph')
  getEcosystemGraph(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Membership() ctx: MembershipContext,
  ) {
    const parsedType = GraphEntityTypeSchema.parse(entityType);
    return this.intelligenceService.getEcosystemGraph(
      parsedType as GraphEntityType,
      entityId,
      ctx,
    );
  }

  @Get('command-center/v3')
  getCommandCenterV3(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(CommandCenterQuerySchema, query);
    return this.intelligenceService.getCommandCenterV3(parsed.period, ctx);
  }

  @Get('command-center/v4')
  getCommandCenterV4(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(CommandCenterQuerySchema, query);
    return this.intelligenceService.getCommandCenterV4(parsed.period, ctx);
  }

  @Get('command-center/v5')
  getCommandCenterV5(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(CommandCenterQuerySchema, query);
    return this.intelligenceService.getCommandCenterV5(parsed.period, ctx);
  }

  @Get('command-center')
  getCommandCenter(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(CommandCenterQuerySchema, query);
    return this.intelligenceService.getCommandCenter(parsed.period, ctx);
  }

  @Get('participation-dashboard')
  getParticipationDashboard(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(CommandCenterQuerySchema, query);
    return this.intelligenceService.getParticipationDashboard(parsed.period, ctx);
  }

  @Get('executive/today')
  getExecutiveToday(@Membership() ctx: MembershipContext) {
    return this.intelligenceService.getExecutiveAggregate('today', ctx);
  }

  @Get('executive/weekly')
  getExecutiveWeekly(@Membership() ctx: MembershipContext) {
    return this.intelligenceService.getExecutiveAggregate('weekly', ctx);
  }

  @Get('executive/monthly')
  getExecutiveMonthly(@Membership() ctx: MembershipContext) {
    return this.intelligenceService.getExecutiveAggregate('monthly', ctx);
  }
}
