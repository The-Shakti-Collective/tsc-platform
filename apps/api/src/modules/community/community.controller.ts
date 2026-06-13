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
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { CommunityService } from './community.service';
import {
  CommunityAddMemberSchema,
  CommunityCreateOpportunitySchema,
  CommunityLeaderSettingsSchema,
  CommunityMemberRolePatchSchema,
  CommunityMembersQuerySchema,
} from './schema';

@Controller('communities')
@UseGuards(ClerkAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get(':id/dashboard')
  getDashboard(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.communityService.getDashboard(id, ctx);
  }

  @Get(':id/members')
  listMembers(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.communityService.listMembers(
      id,
      parseSchema(CommunityMembersQuerySchema, query),
      ctx,
    );
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.communityService.join(id, ctx);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.communityService.leave(id, ctx);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.communityService.addMember(
      id,
      parseSchema(CommunityAddMemberSchema, body),
      ctx,
    );
  }

  @Patch(':id/members/:personId/role')
  updateMemberRole(
    @Param('id') id: string,
    @Param('personId') personId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.communityService.updateMemberRole(
      id,
      personId,
      parseSchema(CommunityMemberRolePatchSchema, body),
      ctx,
    );
  }

  @Get(':id/events')
  listEvents(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.communityService.listEvents(id, ctx);
  }

  @Post(':id/opportunities')
  createOpportunity(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.communityService.createOpportunity(
      id,
      parseSchema(CommunityCreateOpportunitySchema, body),
      ctx,
    );
  }

  @Patch(':id')
  updateLeaderSettings(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.communityService.updateLeaderSettings(
      id,
      parseSchema(CommunityLeaderSettingsSchema, body),
      ctx,
    );
  }
}
