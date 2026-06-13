import type { z } from 'zod';
import type {
  WorkspaceCreateSchema,
  WorkspaceMemberAddSchema,
  WorkspaceMemberPatchSchema,
  WorkspaceSettingsPatchSchema,
  WorkspaceTeamCreateSchema,
} from './schema';

export type WorkspaceCreateInput = z.infer<typeof WorkspaceCreateSchema>;
export type WorkspaceSettingsPatchInput = z.infer<typeof WorkspaceSettingsPatchSchema>;
export type WorkspaceMemberAddInput = z.infer<typeof WorkspaceMemberAddSchema>;
export type WorkspaceMemberPatchInput = z.infer<typeof WorkspaceMemberPatchSchema>;
export type WorkspaceTeamCreateInput = z.infer<typeof WorkspaceTeamCreateSchema>;
