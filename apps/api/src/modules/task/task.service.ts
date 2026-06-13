import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  TASK_BOARD_COLUMNS,
  isTaskComplete,
  type TaskStatusValue,
} from '@tsc/database';
import type {
  TaskBoardPayload,
  TaskChecklistItemSummary,
  TaskCommentSummary,
  TaskDetailPayload,
  TaskSummary,
  TasksListPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { toInputJson } from '../../common/json';
import { ActivityService } from '../activity/activity.service';
import { WorkspaceContextService } from '../workspace/workspace-context.service';
import type {
  TaskChecklistCreateInput,
  TaskChecklistPatchInput,
  TaskCommentCreateInput,
  TaskCreateInput,
  TaskPatchInput,
} from './dto';
import {
  TaskRepository,
  type TaskAssigneeRow,
  type TaskChecklistRow,
  type TaskCommentRow,
  type TaskRow,
} from './task.repository';

type TaskListFilters = {
  projectId?: string;
  projectSlug?: string;
  status?: TaskStatusValue;
  assigneePersonId?: string;
  view?: 'list' | 'board';
};

@Injectable()
export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly workspaceContext: WorkspaceContextService,
    private readonly activityService: ActivityService,
  ) {}

  async list(
    slug: string,
    filters: TaskListFilters,
    ctx: MembershipContext,
  ): Promise<TasksListPayload | TaskBoardPayload> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireMemberAccess(workspace, ctx);

    const resolved = await this.resolveFilters(workspace.id, filters);
    const rows = await this.repository.listByWorkspace(workspace.id, resolved);

    if (filters.view === 'board') {
      const columns = TASK_BOARD_COLUMNS.reduce(
        (acc, status) => {
          acc[status] = rows
            .filter((row) => row.status === status)
            .map((row) => this.toSummary(row));
          return acc;
        },
        {} as Record<TaskStatusValue, TaskSummary[]>,
      );

      return {
        workspaceSlug: workspace.slug,
        columns,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      workspaceSlug: workspace.slug,
      items: rows.map((row) => this.toSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(
    slug: string,
    input: TaskCreateInput,
    ctx: MembershipContext,
  ): Promise<TaskDetailPayload> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    const actor = await this.workspaceContext.requireMemberAccess(workspace, ctx);

    if (input.projectId) {
      await this.assertProjectInWorkspace(workspace.id, input.projectId);
    }

    let projectId = input.projectId ?? null;
    if (!projectId && input.projectSlug) {
      const project = await this.repository.findProjectBySlug(workspace.id, input.projectSlug);
      if (!project) {
        throw new BadRequestException(`Project ${input.projectSlug} not found`);
      }
      projectId = project.id;
    }

    const row = await this.repository.create({
      workspaceId: workspace.id,
      projectId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      createdByPersonId: actor.personId,
      metadata: toInputJson(input.metadata ?? {}),
      assigneePersonIds: input.assigneePersonIds,
    });

    if (!row) {
      throw new ServiceUnavailableException('Task creation failed');
    }

    await this.activityService.recordInternal({
      actorPersonId: actor.personId,
      action: 'task_created',
      targetType: 'Task',
      targetId: row.id,
      metadata: {
        workspaceSlug: workspace.slug,
        projectId: row.projectId,
        taskTitle: row.title,
      },
    });

    return this.toDetail(row);
  }

  async getById(
    slug: string,
    taskId: string,
    ctx: MembershipContext,
  ): Promise<TaskDetailPayload> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireMemberAccess(workspace, ctx);

    const row = await this.requireTask(workspace.id, taskId);
    return this.toDetail(row);
  }

  async patch(
    slug: string,
    taskId: string,
    input: TaskPatchInput,
    ctx: MembershipContext,
  ): Promise<TaskDetailPayload> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    const actor = await this.workspaceContext.requireMemberAccess(workspace, ctx);

    const existing = await this.requireTask(workspace.id, taskId);
    const wasComplete = isTaskComplete(existing.status as TaskStatusValue);

    if (input.projectId) {
      await this.assertProjectInWorkspace(workspace.id, input.projectId);
    }

    const nextMetadata =
      input.metadata != null
        ? {
            ...((existing.metadata as Record<string, unknown>) ?? {}),
            ...input.metadata,
          }
        : undefined;

    const updated = await this.repository.update(taskId, {
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      status: input.status,
      priority: input.priority,
      dueAt:
        input.dueAt !== undefined
          ? input.dueAt
            ? new Date(input.dueAt)
            : null
          : undefined,
      metadata: nextMetadata !== undefined ? toInputJson(nextMetadata) : undefined,
    });

    if (!updated) {
      throw new ServiceUnavailableException('Task update failed');
    }

    if (input.assigneePersonIds) {
      await this.repository.replaceAssignees(taskId, input.assigneePersonIds);
    }

    const refreshed = await this.repository.findByIdAfterAssignees(
      taskId,
      workspace.id,
    );
    const result = refreshed ?? updated;

    const nowComplete = isTaskComplete(result.status as TaskStatusValue);
    if (!wasComplete && nowComplete) {
      await this.activityService.recordInternal({
        actorPersonId: actor.personId,
        action: 'task_completed',
        targetType: 'Task',
        targetId: result.id,
        metadata: {
          workspaceSlug: workspace.slug,
          projectId: result.projectId,
          taskTitle: result.title,
        },
      });
    }

    return this.toDetail(result);
  }

  async delete(
    slug: string,
    taskId: string,
    ctx: MembershipContext,
  ): Promise<TaskSummary> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireMemberAccess(workspace, ctx);

    const existing = await this.requireTask(workspace.id, taskId);
    const deleted = await this.repository.delete(taskId);
    if (!deleted) {
      throw new ServiceUnavailableException('Task delete failed');
    }

    return this.toSummary(existing);
  }

  async addComment(
    slug: string,
    taskId: string,
    input: TaskCommentCreateInput,
    ctx: MembershipContext,
  ): Promise<TaskCommentSummary> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    const actor = await this.workspaceContext.requireMemberAccess(workspace, ctx);

    await this.requireTask(workspace.id, taskId);

    const row = await this.repository.addComment({
      taskId,
      authorPersonId: actor.personId,
      body: input.body,
    });

    if (!row) {
      throw new ServiceUnavailableException('Task comment failed');
    }

    return this.toCommentSummary(row);
  }

  async addChecklistItem(
    slug: string,
    taskId: string,
    input: TaskChecklistCreateInput,
    ctx: MembershipContext,
  ): Promise<TaskChecklistItemSummary> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireMemberAccess(workspace, ctx);

    await this.requireTask(workspace.id, taskId);

    const row = await this.repository.addChecklistItem({
      taskId,
      title: input.title,
      order: input.order,
    });

    if (!row) {
      throw new ServiceUnavailableException('Checklist item creation failed');
    }

    return this.toChecklistSummary(row);
  }

  async patchChecklistItem(
    slug: string,
    taskId: string,
    itemId: string,
    input: TaskChecklistPatchInput,
    ctx: MembershipContext,
  ): Promise<TaskChecklistItemSummary> {
    this.assertAvailable();
    const workspace = await this.workspaceContext.requireWorkspace(slug);
    await this.workspaceContext.requireMemberAccess(workspace, ctx);

    await this.requireTask(workspace.id, taskId);

    const row = await this.repository.patchChecklistItem(itemId, taskId, input);
    if (!row) {
      throw new NotFoundException(`Checklist item ${itemId} not found`);
    }

    return this.toChecklistSummary(row);
  }

  private async resolveFilters(
    workspaceId: string,
    filters: TaskListFilters,
  ): Promise<{
    projectId?: string;
    status?: TaskStatusValue;
    assigneePersonId?: string;
  }> {
    let projectId = filters.projectId;

    if (filters.projectSlug && !projectId) {
      const project = await this.repository.findProjectBySlug(
        workspaceId,
        filters.projectSlug,
      );
      if (!project) {
        throw new NotFoundException(`Project ${filters.projectSlug} not found`);
      }
      projectId = project.id;
    }

    return {
      projectId,
      status: filters.status,
      assigneePersonId: filters.assigneePersonId,
    };
  }

  private async assertProjectInWorkspace(
    workspaceId: string,
    projectId: string,
  ): Promise<void> {
    const project = await this.repository.findProjectById(workspaceId, projectId);
    if (!project) {
      throw new BadRequestException('Project must belong to workspace');
    }
  }

  private async requireTask(workspaceId: string, taskId: string): Promise<TaskRow> {
    const row = await this.repository.findById(taskId, workspaceId);
    if (!row) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    return row;
  }

  private toSummary(row: TaskRow): TaskSummary {
    const assignees = row.assignees ?? [];
    const comments = row.comments ?? [];
    const checklist = row.checklist ?? [];
    const checklistDone = checklist.filter((item) => item.isDone).length;
    const createdBy = row.createdBy;

    return {
      id: row.id,
      workspaceId: row.workspaceId,
      projectId: row.projectId,
      projectSlug: row.project?.slug ?? null,
      projectName: row.project?.name ?? null,
      title: row.title,
      description: row.description,
      status: row.status as TaskSummary['status'],
      priority: row.priority as TaskSummary['priority'],
      dueAt: row.dueAt?.toISOString() ?? null,
      createdByPersonId: row.createdByPersonId,
      createdByName:
        createdBy?.displayName?.trim() ||
        createdBy?.name?.trim() ||
        createdBy?.id ||
        row.createdByPersonId,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      assigneeCount: assignees.length,
      commentCount: comments.length,
      checklistDone,
      checklistTotal: checklist.length,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDetail(row: TaskRow): TaskDetailPayload {
    const summary = this.toSummary(row);
    return {
      ...summary,
      assignees: (row.assignees ?? []).map((a) => this.toAssigneeSummary(a)),
      comments: (row.comments ?? []).map((c) => this.toCommentSummary(c)),
      checklist: (row.checklist ?? []).map((item) => this.toChecklistSummary(item)),
    };
  }

  private toAssigneeSummary(row: TaskAssigneeRow) {
    const person = row.person;
    return {
      taskId: row.taskId,
      personId: row.personId,
      displayName:
        person?.displayName?.trim() ||
        person?.name?.trim() ||
        person?.id ||
        row.personId,
      slug: person?.profile?.slug ?? null,
      assignedAt: row.assignedAt.toISOString(),
    };
  }

  private toCommentSummary(row: TaskCommentRow): TaskCommentSummary {
    const author = row.author;
    return {
      id: row.id,
      taskId: row.taskId,
      authorPersonId: row.authorPersonId,
      authorName:
        author?.displayName?.trim() ||
        author?.name?.trim() ||
        author?.id ||
        row.authorPersonId,
      authorSlug: author?.profile?.slug ?? null,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toChecklistSummary(row: TaskChecklistRow): TaskChecklistItemSummary {
    return {
      id: row.id,
      taskId: row.taskId,
      title: row.title,
      isDone: row.isDone,
      order: row.order,
    };
  }

  private assertAvailable(): void {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Task models unavailable');
    }
  }
}
