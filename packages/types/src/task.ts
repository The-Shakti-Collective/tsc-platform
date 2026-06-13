import type { TaskPriorityValue, TaskStatusValue } from '@tsc/database';

export type TaskStatus = TaskStatusValue;
export type TaskPriority = TaskPriorityValue;

export interface TaskAssigneeSummary {
  taskId: string;
  personId: string;
  displayName: string;
  slug: string | null;
  assignedAt: string;
}

export interface TaskCommentSummary {
  id: string;
  taskId: string;
  authorPersonId: string;
  authorName: string;
  authorSlug: string | null;
  body: string;
  createdAt: string;
}

export interface TaskChecklistItemSummary {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  order: number;
}

export interface TaskSummary {
  id: string;
  workspaceId: string;
  projectId: string | null;
  projectSlug: string | null;
  projectName: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  createdByPersonId: string;
  createdByName: string;
  metadata: Record<string, unknown>;
  assigneeCount: number;
  commentCount: number;
  checklistDone: number;
  checklistTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetailPayload extends TaskSummary {
  assignees: TaskAssigneeSummary[];
  comments: TaskCommentSummary[];
  checklist: TaskChecklistItemSummary[];
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  projectId?: string;
  projectSlug?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string;
  assigneePersonIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskPatchInput {
  title?: string;
  description?: string | null;
  projectId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string | null;
  assigneePersonIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskCommentCreateInput {
  body: string;
}

export interface TaskChecklistCreateInput {
  title: string;
  order?: number;
}

export interface TaskChecklistPatchInput {
  title?: string;
  isDone?: boolean;
  order?: number;
}

export interface TasksListPayload {
  workspaceSlug: string;
  items: TaskSummary[];
  updatedAt: string;
}

export interface TaskBoardPayload {
  workspaceSlug: string;
  columns: Record<TaskStatus, TaskSummary[]>;
  updatedAt: string;
}
