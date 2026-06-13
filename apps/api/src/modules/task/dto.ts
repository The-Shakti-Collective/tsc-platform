import type { z } from 'zod';
import type {
  TaskChecklistCreateSchema,
  TaskChecklistPatchSchema,
  TaskCommentCreateSchema,
  TaskCreateSchema,
  TaskPatchSchema,
} from './schema';

export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;
export type TaskPatchInput = z.infer<typeof TaskPatchSchema>;
export type TaskCommentCreateInput = z.infer<typeof TaskCommentCreateSchema>;
export type TaskChecklistCreateInput = z.infer<typeof TaskChecklistCreateSchema>;
export type TaskChecklistPatchInput = z.infer<typeof TaskChecklistPatchSchema>;
