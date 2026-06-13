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
  ProjectCreateSchema,
  ProjectMemberAddSchema,
  ProjectPatchSchema,
  WorkspaceProjectSlugParamSchema,
} from './schema';
import { WorkspaceSlugParamSchema } from '../workspace/schema';
import { ProjectService } from './project.service';

@Controller('workspace/:slug/projects')
@UseGuards(ClerkAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  list(@Param('slug') slug: string, @Membership() ctx: MembershipContext) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    return this.projectService.list(parsed.slug, ctx);
  }

  @Post()
  create(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    return this.projectService.create(
      parsed.slug,
      parseSchema(ProjectCreateSchema, body),
      ctx,
    );
  }

  @Get(':projectSlug')
  getBySlug(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceProjectSlugParamSchema, { slug, projectSlug });
    return this.projectService.getBySlug(params.slug, params.projectSlug, ctx);
  }

  @Patch(':projectSlug')
  patch(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceProjectSlugParamSchema, { slug, projectSlug });
    return this.projectService.patch(
      params.slug,
      params.projectSlug,
      parseSchema(ProjectPatchSchema, body),
      ctx,
    );
  }

  @Delete(':projectSlug')
  delete(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceProjectSlugParamSchema, { slug, projectSlug });
    return this.projectService.delete(params.slug, params.projectSlug, ctx);
  }

  @Get(':projectSlug/members')
  listMembers(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceProjectSlugParamSchema, { slug, projectSlug });
    return this.projectService.listMembers(params.slug, params.projectSlug, ctx);
  }

  @Post(':projectSlug/members')
  addMember(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceProjectSlugParamSchema, { slug, projectSlug });
    return this.projectService.addMember(
      params.slug,
      params.projectSlug,
      parseSchema(ProjectMemberAddSchema, body),
      ctx,
    );
  }
}
