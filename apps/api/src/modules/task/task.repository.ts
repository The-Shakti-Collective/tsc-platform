import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { taskInclude, tasksByWorkspaceWhere, type TaskStatusValue } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type TaskRow = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: Date | null;
  createdByPersonId: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; slug: string; name: string } | null;
  createdBy?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile: { slug: string; username: string | null } | null;
  };
  assignees?: TaskAssigneeRow[];
  comments?: TaskCommentRow[];
  checklist?: TaskChecklistRow[];
};

type TaskAssigneeRow = {
  taskId: string;
  personId: string;
  assignedAt: Date;
  person?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile: { slug: string; username: string | null } | null;
  };
};

type TaskCommentRow = {
  id: string;
  taskId: string;
  authorPersonId: string;
  body: string;
  createdAt: Date;
  author?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile: { slug: string; username: string | null } | null;
  };
};

type TaskChecklistRow = {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  order: number;
};

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(field: string): unknown {
    return (this.prisma.client as unknown as Record<string, unknown>)[field] ?? null;
  }

  isAvailable(): boolean {
    return this.client('task') != null;
  }

  findById(taskId: string, workspaceId: string) {
    const task = this.client('task') as {
      findFirst: (args: unknown) => Promise<TaskRow | null>;
    } | null;
    if (!task) return Promise.resolve(null);
    return task.findFirst({
      where: { id: taskId, workspaceId },
      include: taskInclude,
    });
  }

  listByWorkspace(
    workspaceId: string,
    filters?: {
      projectId?: string;
      status?: TaskStatusValue;
      assigneePersonId?: string;
    },
  ) {
    const task = this.client('task') as {
      findMany: (args: unknown) => Promise<TaskRow[]>;
    } | null;
    if (!task) return Promise.resolve([]);
    return task.findMany({
      where: tasksByWorkspaceWhere(workspaceId, filters),
      include: taskInclude,
      orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(input: {
    workspaceId: string;
    projectId?: string | null;
    title: string;
    description?: string | null;
    status?: string;
    priority?: string;
    dueAt?: Date | null;
    createdByPersonId: string;
    metadata?: Prisma.InputJsonValue;
    assigneePersonIds?: string[];
  }) {
    const task = this.client('task') as {
      create: (args: unknown) => Promise<TaskRow>;
    } | null;
    if (!task) return Promise.resolve(null);

    const assignees = input.assigneePersonIds?.length
      ? {
          create: input.assigneePersonIds.map((personId) => ({ personId })),
        }
      : undefined;

    return task.create({
      data: {
        id: newId(),
        workspaceId: input.workspaceId,
        projectId: input.projectId ?? null,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? 'todo',
        priority: input.priority ?? 'medium',
        dueAt: input.dueAt ?? null,
        createdByPersonId: input.createdByPersonId,
        metadata: input.metadata ?? {},
        assignees,
      },
      include: taskInclude,
    });
  }

  update(
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      projectId?: string | null;
      status?: string;
      priority?: string;
      dueAt?: Date | null;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    const task = this.client('task') as {
      update: (args: unknown) => Promise<TaskRow>;
    } | null;
    if (!task) return Promise.resolve(null);
    return task.update({
      where: { id: taskId },
      data,
      include: taskInclude,
    });
  }

  delete(taskId: string) {
    const task = this.client('task') as {
      delete: (args: unknown) => Promise<TaskRow>;
    } | null;
    if (!task) return Promise.resolve(null);
    return task.delete({
      where: { id: taskId },
      include: taskInclude,
    });
  }

  replaceAssignees(taskId: string, personIds: string[]) {
    const assignee = this.client('taskAssignee') as {
      deleteMany: (args: unknown) => Promise<unknown>;
      createMany: (args: unknown) => Promise<unknown>;
    } | null;
    if (!assignee) return Promise.resolve(null);

    return assignee
      .deleteMany({ where: { taskId } })
      .then(() =>
        personIds.length
          ? assignee.createMany({
              data: personIds.map((personId) => ({ taskId, personId })),
              skipDuplicates: true,
            })
          : null,
      );
  }

  findByIdAfterAssignees(taskId: string, workspaceId: string) {
    return this.findById(taskId, workspaceId);
  }

  addComment(input: { taskId: string; authorPersonId: string; body: string }) {
    const comment = this.client('taskComment') as {
      create: (args: unknown) => Promise<TaskCommentRow>;
    } | null;
    if (!comment) return Promise.resolve(null);
    return comment.create({
      data: {
        id: newId(),
        taskId: input.taskId,
        authorPersonId: input.authorPersonId,
        body: input.body,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            name: true,
            profile: { select: { slug: true, username: true } },
          },
        },
      },
    });
  }

  addChecklistItem(input: { taskId: string; title: string; order?: number }) {
    const checklist = this.client('taskChecklist') as {
      create: (args: unknown) => Promise<TaskChecklistRow>;
    } | null;
    if (!checklist) return Promise.resolve(null);
    return checklist.create({
      data: {
        id: newId(),
        taskId: input.taskId,
        title: input.title,
        order: input.order ?? 0,
      },
    });
  }

  patchChecklistItem(
    itemId: string,
    taskId: string,
    data: { title?: string; isDone?: boolean; order?: number },
  ) {
    const checklist = this.client('taskChecklist') as {
      updateMany: (args: unknown) => Promise<{ count: number }>;
      findFirst: (args: unknown) => Promise<TaskChecklistRow | null>;
    } | null;
    if (!checklist) return Promise.resolve(null);

    return checklist
      .updateMany({
        where: { id: itemId, taskId },
        data,
      })
      .then(async (result) => {
        if (!result.count) return null;
        return checklist.findFirst({ where: { id: itemId, taskId } });
      });
  }

  findProjectBySlug(workspaceId: string, projectSlug: string) {
    const project = this.client('project') as {
      findFirst: (args: unknown) => Promise<{ id: string; slug: string } | null>;
    } | null;
    if (!project) return Promise.resolve(null);
    return project.findFirst({
      where: { workspaceId, slug: projectSlug },
      select: { id: true, slug: true },
    });
  }

  findProjectById(workspaceId: string, projectId: string) {
    const project = this.client('project') as {
      findFirst: (args: unknown) => Promise<{ id: string; slug: string } | null>;
    } | null;
    if (!project) return Promise.resolve(null);
    return project.findFirst({
      where: { workspaceId, id: projectId },
      select: { id: true, slug: true },
    });
  }
}

export type { TaskRow, TaskAssigneeRow, TaskCommentRow, TaskChecklistRow };
