import {
  Body,
  Controller,
  Delete,
  Get,
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
import { TaskCreateSchema, TaskPatchSchema } from '../task/schema';
import { TaskService } from '../task/task.service';
import { CoreknotContextService } from './coreknot-context.service';
import { toLegacyTask } from './coreknot-compat.mappers';

/** CoreKnot client compat — flat `/api/tasks/*` (legacy Taskmaster paths). */
@Controller('tasks')
@UseGuards(CoreknotCompatGuard, ClerkAuthGuard)
export class TasksLegacyController {
  constructor(
    private readonly taskService: TaskService,
    private readonly context: CoreknotContextService,
  ) {}

  @Get()
  async list(@Query() query: Record<string, unknown>, @Membership() ctx: MembershipContext) {
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    const payload = await this.taskService.list(
      slug,
      {
        projectId: typeof query.projectId === 'string' ? query.projectId : undefined,
        status: typeof query.status === 'string' ? (query.status as 'todo') : undefined,
      },
      ctx,
    );

    const items = 'items' in payload ? payload.items : [];
    const legacyTasks = items.map((item) => toLegacyTask(item));

    if (query.scope === 'todo') {
      return {
        tasks: legacyTasks,
        total: legacyTasks.length,
        page: Number(query.page ?? 1),
        limit: Number(query.limit ?? (legacyTasks.length || 50)),
      };
    }

    return legacyTasks;
  }

  @Post()
  async create(@Body() body: Record<string, unknown>, @Membership() ctx: MembershipContext) {
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    const input = parseSchema(TaskCreateSchema, {
      title: body.title ?? body.name ?? 'Untitled task',
      description: body.description,
      status: body.status,
      priority: body.priority,
      projectId: body.projectId ?? body.project,
      dueAt: body.dueAt ?? body.dueDate,
    });
    const created = await this.taskService.create(slug, input, ctx);
    return toLegacyTask(created);
  }

  @Post('bug')
  reportBug(@Body() body: Record<string, unknown>, @Membership() ctx: MembershipContext) {
    return this.create(
      {
        title: body.title ?? 'Bug report',
        description: body.description ?? body.details,
        priority: 'high',
      },
      ctx,
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    const detail = await this.taskService.getById(slug, id, ctx);
    return toLegacyTask(detail);
  }

  @Put(':id')
  async updateById(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    const patch = parseSchema(TaskPatchSchema, body);
    const updated = await this.taskService.patch(slug, id, patch, ctx);
    return toLegacyTask(updated);
  }

  @Delete(':id')
  async deleteById(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    const deleted = await this.taskService.delete(slug, id, ctx);
    return toLegacyTask(deleted);
  }

  @Get(':id/activity')
  async listActivity(
    @Param('id') id: string,
    @Membership() ctx: MembershipContext,
  ) {
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    await this.taskService.getById(slug, id, ctx);
    return [];
  }

  @Post(':id/activity')
  async addActivity(
    @Param('id') id: string,
    @Body() body: { body?: string },
    @Membership() ctx: MembershipContext,
  ) {
    const slug = await this.context.resolveWorkspaceSlug(ctx);
    const comment = await this.taskService.addComment(
      slug,
      id,
      { body: body.body ?? '' },
      ctx,
    );
    return {
      _id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
    };
  }
}
