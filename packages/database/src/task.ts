import type { Prisma } from '@prisma/client';

export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done'] as const;

export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];

export const TASK_MODELS = ['Task', 'TaskAssignee', 'TaskComment', 'TaskChecklist'] as const;

export const TASK_STATUS_LABELS: Record<TaskStatusValue, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriorityValue, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TASK_BOARD_COLUMNS: TaskStatusValue[] = [
  'todo',
  'in_progress',
  'blocked',
  'done',
];

export function tasksByWorkspaceWhere(
  workspaceId: string,
  filters?: {
    projectId?: string;
    status?: TaskStatusValue;
    assigneePersonId?: string;
  },
): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { workspaceId };

  if (filters?.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.assigneePersonId) {
    where.assignees = {
      some: { personId: filters.assigneePersonId },
    };
  }

  return where;
}

export const taskAssigneeInclude = {
  person: {
    select: {
      id: true,
      displayName: true,
      name: true,
      profile: {
        select: {
          slug: true,
          username: true,
        },
      },
    },
  },
} satisfies Prisma.TaskAssigneeInclude;

export const taskCommentInclude = {
  author: {
    select: {
      id: true,
      displayName: true,
      name: true,
      profile: {
        select: {
          slug: true,
          username: true,
        },
      },
    },
  },
} satisfies Prisma.TaskCommentInclude;

export const taskInclude = {
  project: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      displayName: true,
      name: true,
      profile: {
        select: {
          slug: true,
          username: true,
        },
      },
    },
  },
  assignees: {
    include: taskAssigneeInclude,
    orderBy: { assignedAt: 'asc' as const },
  },
  comments: {
    include: taskCommentInclude,
    orderBy: { createdAt: 'asc' as const },
  },
  checklist: {
    orderBy: { order: 'asc' as const },
  },
} satisfies Prisma.TaskInclude;

export function isTaskComplete(status: TaskStatusValue): boolean {
  return status === 'done';
}
