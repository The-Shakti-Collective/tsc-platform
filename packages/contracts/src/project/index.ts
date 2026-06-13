import { z } from 'zod';

export const ProjectTypeSchema = z.enum([
  'album',
  'tour',
  'festival',
  'community_campaign',
  'brand_campaign',
  'music_video',
  'general',
]);

export const ProjectStatusSchema = z.enum([
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived',
]);

export const ProjectMemberRoleSchema = z.enum(['owner', 'lead', 'member', 'viewer']);

export const WorkspaceProjectSlugParamSchema = z.object({
  slug: z.string().min(1).max(80),
  projectSlug: z.string().min(1).max(80),
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(80).optional(),
  type: ProjectTypeSchema.optional().default('general'),
  description: z.string().max(4000).optional(),
  status: ProjectStatusSchema.optional().default('planning'),
  budget: z.number().nonnegative().optional(),
  currency: z.string().min(1).max(8).optional(),
  timelineStart: z.string().datetime().optional(),
  timelineEnd: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ProjectPatchSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  type: ProjectTypeSchema.optional(),
  description: z.string().max(4000).nullable().optional(),
  status: ProjectStatusSchema.optional(),
  budget: z.number().nonnegative().nullable().optional(),
  currency: z.string().min(1).max(8).nullable().optional(),
  timelineStart: z.string().datetime().nullable().optional(),
  timelineEnd: z.string().datetime().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ProjectMemberAddSchema = z.object({
  personId: z.string().min(1),
  role: ProjectMemberRoleSchema.optional().default('member'),
});
