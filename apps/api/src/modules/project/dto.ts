import type { z } from 'zod';
import type {
  ProjectCreateSchema,
  ProjectMemberAddSchema,
  ProjectPatchSchema,
} from './schema';

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
export type ProjectPatchInput = z.infer<typeof ProjectPatchSchema>;
export type ProjectMemberAddInput = z.infer<typeof ProjectMemberAddSchema>;
