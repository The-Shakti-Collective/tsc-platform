import {
  Body,
  Controller,
  Delete,
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
import { WorkspaceSlugParamSchema } from '../workspace/schema';
import {
  TaskChecklistCreateSchema,
  TaskChecklistPatchSchema,
  TaskCommentCreateSchema,
  TaskCreateSchema,
  TaskListQuerySchema,
  TaskPatchSchema,
  WorkspaceTaskChecklistParamSchema,
  WorkspaceTaskIdParamSchema,
} from './schema';
import { TaskService } from './task.service';

@Controller('workspace/:slug/tasks')
@UseGuards(ClerkAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  list(
    @Param('slug') slug: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    const filters = parseSchema(TaskListQuerySchema, query);
    return this.taskService.list(parsed.slug, filters, ctx);
  }

  @Post()
  create(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(WorkspaceSlugParamSchema, { slug });
    return this.taskService.create(
      parsed.slug,
      parseSchema(TaskCreateSchema, body),
      ctx,
    );
  }

  @Get(':taskId')
  getById(
    @Param('slug') slug: string,
    @Param('taskId') taskId: string,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceTaskIdParamSchema, { slug, taskId });
    return this.taskService.getById(params.slug, params.taskId, ctx);
  }

  @Patch(':taskId')
  patch(
    @Param('slug') slug: string,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceTaskIdParamSchema, { slug, taskId });
    return this.taskService.patch(
      params.slug,
      params.taskId,
      parseSchema(TaskPatchSchema, body),
      ctx,
    );
  }

  @Delete(':taskId')
  delete(
    @Param('slug') slug: string,
    @Param('taskId') taskId: string,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceTaskIdParamSchema, { slug, taskId });
    return this.taskService.delete(params.slug, params.taskId, ctx);
  }

  @Post(':taskId/comments')
  addComment(
    @Param('slug') slug: string,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceTaskIdParamSchema, { slug, taskId });
    return this.taskService.addComment(
      params.slug,
      params.taskId,
      parseSchema(TaskCommentCreateSchema, body),
      ctx,
    );
  }

  @Post(':taskId/checklist')
  addChecklistItem(
    @Param('slug') slug: string,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceTaskIdParamSchema, { slug, taskId });
    return this.taskService.addChecklistItem(
      params.slug,
      params.taskId,
      parseSchema(TaskChecklistCreateSchema, body),
      ctx,
    );
  }

  @Patch(':taskId/checklist/:itemId')
  patchChecklistItem(
    @Param('slug') slug: string,
    @Param('taskId') taskId: string,
    @Param('itemId') itemId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const params = parseSchema(WorkspaceTaskChecklistParamSchema, {
      slug,
      taskId,
      itemId,
    });
    return this.taskService.patchChecklistItem(
      params.slug,
      params.taskId,
      params.itemId,
      parseSchema(TaskChecklistPatchSchema, body),
      ctx,
    );
  }
}
