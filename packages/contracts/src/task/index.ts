import { z } from 'zod';

export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'blocked', 'done']);

export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const WorkspaceTaskIdParamSchema = z.object({
  slug: z.string().min(1).max(80),
  taskId: z.string().min(1),
});

export const WorkspaceTaskChecklistParamSchema = z.object({
  slug: z.string().min(1).max(80),
  taskId: z.string().min(1),
  itemId: z.string().min(1),
});

export const TaskListQuerySchema = z.object({
  projectId: z.string().min(1).optional(),
  projectSlug: z.string().min(1).max(80).optional(),
  status: TaskStatusSchema.optional(),
  assigneePersonId: z.string().min(1).optional(),
  view: z.enum(['list', 'board']).optional().default('list'),
});

export const TaskCreateSchema = z.object({
  title: z.string().min(1).max(240),
  description: z.string().max(8000).optional(),
  projectId: z.string().min(1).optional(),
  projectSlug: z.string().min(1).max(80).optional(),
  status: TaskStatusSchema.optional().default('todo'),
  priority: TaskPrioritySchema.optional().default('medium'),
  dueAt: z.string().datetime().optional(),
  assigneePersonIds: z.array(z.string().min(1)).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const TaskPatchSchema = z.object({
  title: z.string().min(1).max(240).optional(),
  description: z.string().max(8000).nullable().optional(),
  projectId: z.string().min(1).nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  dueAt: z.string().datetime().nullable().optional(),
  assigneePersonIds: z.array(z.string().min(1)).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const TaskCommentCreateSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const TaskChecklistCreateSchema = z.object({
  title: z.string().min(1).max(240),
  order: z.number().int().min(0).optional(),
});

export const TaskChecklistPatchSchema = z.object({
  title: z.string().min(1).max(240).optional(),
  isDone: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});
