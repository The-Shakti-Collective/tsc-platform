export {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_BOARD_COLUMNS,
  TASK_MODELS,
  tasksByWorkspaceWhere,
  taskInclude,
  isTaskComplete,
  type TaskStatusValue,
  type TaskPriorityValue,
} from '@tsc/database';

export {
  TaskStatusSchema,
  TaskPrioritySchema,
  TaskCreateSchema,
  TaskPatchSchema,
  TaskListQuerySchema,
  TaskCommentCreateSchema,
  TaskChecklistCreateSchema,
  TaskChecklistPatchSchema,
  WorkspaceTaskIdParamSchema,
  WorkspaceTaskChecklistParamSchema,
} from '@tsc/contracts';

export type {
  TaskSummary,
  TaskDetailPayload,
  TaskAssigneeSummary,
  TaskCommentSummary,
  TaskChecklistItemSummary,
  TaskCreateInput,
  TaskPatchInput,
  TaskCommentCreateInput,
  TaskChecklistCreateInput,
  TaskChecklistPatchInput,
  TasksListPayload,
  TaskBoardPayload,
} from '@tsc/types';

export function buildTasksRoute(workspaceSlug: string): string {
  return `/workspace/${workspaceSlug}/tasks`;
}

export function buildTaskApiPath(workspaceSlug: string, segment = ''): string {
  const normalized = segment.startsWith('/') ? segment : segment ? `/${segment}` : '';
  return `/api/workspace/${workspaceSlug}/tasks${normalized}`;
}
