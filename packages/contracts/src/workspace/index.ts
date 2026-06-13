import { z } from 'zod';

export const WorkspaceTypeSchema = z.enum([
  'artist',
  'manager',
  'team',
  'community_leader',
  'agency',
  'personal',
]);

export const WorkspaceMemberRoleSchema = z.enum(['owner', 'admin', 'member', 'guest']);

export const WorkspaceSlugParamSchema = z.object({
  slug: z.string().min(1).max(80),
});

export const WorkspaceMemberPersonParamSchema = z.object({
  slug: z.string().min(1).max(80),
  personId: z.string().min(1),
});

export const WorkspaceCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).optional(),
  type: WorkspaceTypeSchema.optional().default('personal'),
  settings: z.record(z.unknown()).optional(),
});

export const WorkspaceSettingsPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const WorkspaceMemberAddSchema = z.object({
  personId: z.string().min(1),
  role: WorkspaceMemberRoleSchema.optional().default('member'),
});

export const WorkspaceMemberPatchSchema = z.object({
  role: WorkspaceMemberRoleSchema,
});

export const WorkspaceTeamCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).optional(),
  description: z.string().max(2000).optional(),
});
