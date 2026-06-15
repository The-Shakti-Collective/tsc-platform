import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { CoreknotCompatGuard } from '../../common/guards/coreknot-compat.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { parseSchema } from '../../common/validation/parse-schema';
import { ProjectCreateSchema, ProjectPatchSchema } from '../project/schema';
import { ProjectRepository } from '../project/project.repository';
import { ProjectService } from '../project/project.service';
import { CoreknotContextService } from './coreknot-context.service';
import {
  defaultLegacyWorkspaces,
  toLegacyProject,
} from './coreknot-compat.mappers';

/** CoreKnot client compat — flat `/api/projects/*` (legacy Taskmaster paths). */
@Controller('projects')
@UseGuards(CoreknotCompatGuard, ClerkAuthGuard)
export class ProjectsLegacyController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectRepository: ProjectRepository,
    private readonly context: CoreknotContextService,
  ) {}

  @Get()
  async list(@Membership() ctx: MembershipContext) {
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    const payload = await this.projectService.list(slug, ctx);
    return payload.items.map((item) => toLegacyProject(item));
  }

  @Post()
  async create(@Body() body: Record<string, unknown>, @Membership() ctx: MembershipContext) {
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    const input = parseSchema(ProjectCreateSchema, {
      name: body.name,
      slug: body.slug,
      type: body.type,
      description: body.description,
      status: body.status,
    });
    const created = await this.projectService.create(slug, input, ctx);
    const workspaceName =
      typeof body.workspace === 'string' ? body.workspace : 'GENERAL';
    return toLegacyProject(created, workspaceName);
  }

  @Get('workspaces')
  workspaces() {
    return defaultLegacyWorkspaces();
  }

  @Post('workspaces')
  createWorkspace(@Body() body: { name?: string; color?: string }) {
    const name = String(body.name ?? 'GENERAL').toUpperCase().trim();
    return {
      name,
      color: body.color ?? '#64748b',
      order: defaultLegacyWorkspaces().length,
    };
  }

  @Put('workspaces')
  reorderWorkspaces(@Body() body: { order?: string[] }) {
    const names = body.order ?? [];
    return names.map((name, order) => ({
      name,
      color: '#64748b',
      order,
    }));
  }

  @Get('workspaces/:name')
  workspaceByName(@Param('name') name: string) {
    const normalized = decodeURIComponent(name).toUpperCase();
    const match = defaultLegacyWorkspaces().find((w) => w.name === normalized);
    return match ?? { name: normalized, color: '#64748b', order: 99 };
  }

  @Delete('workspaces/:name')
  deleteWorkspace(@Param('name') name: string) {
    return { message: `Workspace ${decodeURIComponent(name)} removed` };
  }

  @Get('analytics-summary')
  analyticsSummary(@Query() _query: Record<string, unknown>) {
    return { projects: [], totals: { tasks: 0, completed: 0 } };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const row = await this.projectRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Project not found');
    }
    return toLegacyProject({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      type: row.type,
      description: row.description,
      taskCount: row.tasks?.length ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    });
  }

  @Put(':id')
  async updateById(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const row = await this.projectRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Project not found');
    }
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    const patch = parseSchema(ProjectPatchSchema, body);
    const updated = await this.projectService.patch(slug, row.slug, patch, ctx);
    const workspaceName =
      typeof body.workspace === 'string' ? body.workspace : 'GENERAL';
    return toLegacyProject(updated, workspaceName);
  }

  @Get(':id/analytics')
  projectAnalytics(@Param('id') _id: string, @Query() _query: Record<string, unknown>) {
    return { tasks: [], totals: { total: 0, completed: 0 } };
  }

  @Get(':id/workload')
  workload(@Param('id') _id: string, @Query() _query: Record<string, unknown>) {
    return { days: [], tasks: [] };
  }

  @Get(':id/hours-summary')
  hoursSummary(@Param('id') _id: string) {
    return { totalHours: 0, byMember: [] };
  }

  @Put(':id/remove-member')
  removeMember(@Param('id') _id: string, @Body() _body: { userId?: string }) {
    return { ok: true };
  }
}
