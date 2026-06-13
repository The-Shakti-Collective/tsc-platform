import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  WorkspaceCreateSchema,
  WorkspaceMemberAddSchema,
  WorkspaceMemberPatchSchema,
  WorkspaceMemberPersonParamSchema,
  WorkspaceSettingsPatchSchema,
  WorkspaceSlugParamSchema,
  WorkspaceTeamCreateSchema,
} from './schema';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
@UseGuards(ClerkAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  create(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.workspaceService.create(parseSchema(WorkspaceCreateSchema, body), ctx);
  }

  @Get('me')
  getMyWorkspace(@Membership() ctx: MembershipContext) {
    return this.workspaceService.getMyWorkspace(ctx);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @Membership() ctx: MembershipContext) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    return this.workspaceService.getBySlug(parsed.slug, ctx);
  }

  @Patch(':slug')
  patchSettings(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    return this.workspaceService.patchSettings(
      parsed.slug,
      parseSchema(WorkspaceSettingsPatchSchema, body),
      ctx,
    );
  }

  @Get(':slug/members')
  listMembers(@Param('slug') slug: string, @Membership() ctx: MembershipContext) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    return this.workspaceService.listMembers(parsed.slug, ctx);
  }

  @Post(':slug/members')
  addMember(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    return this.workspaceService.addMember(
      parsed.slug,
      parseSchema(WorkspaceMemberAddSchema, body),
      ctx,
    );
  }

  @Patch(':slug/members/:personId')
  patchMemberRole(
    @Param('slug') slug: string,
    @Param('personId') personId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceMemberPersonParamSchema, { slug, personId });
    return this.workspaceService.patchMemberRole(
      params.slug,
      params.personId,
      parseSchema(WorkspaceMemberPatchSchema, body),
      ctx,
    );
  }

  @Delete(':slug/members/:personId')
  removeMember(
    @Param('slug') slug: string,
    @Param('personId') personId: string,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceMemberPersonParamSchema, { slug, personId });
    return this.workspaceService.removeMember(params.slug, params.personId, ctx);
  }

  @Post(':slug/teams')
  createTeam(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    return this.workspaceService.createTeam(
      parsed.slug,
      parseSchema(WorkspaceTeamCreateSchema, body),
      ctx,
    );
  }

  @Get(':slug/teams')
  listTeams(@Param('slug') slug: string, @Membership() ctx: MembershipContext) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    return this.workspaceService.listTeams(parsed.slug, ctx);
  }
}
