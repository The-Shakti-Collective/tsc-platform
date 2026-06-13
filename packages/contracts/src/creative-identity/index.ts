import { z } from 'zod';
import { CREATIVE_ROLE_TAGS, CREATIVE_VERTICALS, PERSON_ROLE_TYPES } from '@tsc/database';

export const CreativeVerticalSchema = z.enum(CREATIVE_VERTICALS);

export const CreativeRoleTagSchema = z.enum(CREATIVE_ROLE_TAGS);

export const CreativeIdentitySlugParamSchema = z.object({
  slug: z.string().min(1).max(80),
});

export const CreativeRoleIdParamSchema = z.object({
  roleId: z.string().min(1),
});

export const CreativeIdentityPatchSchema = z
  .object({
    headline: z.string().max(200).nullable().optional(),
    bio: z.string().max(2000).nullable().optional(),
    avatarUrl: z.string().url().max(500).nullable().optional(),
    primaryCity: z.string().max(120).nullable().optional(),
    verticals: z.array(CreativeVerticalSchema).max(10).optional(),
    roles: z.array(CreativeRoleTagSchema).max(12).optional(),
    capabilities: z.array(z.string().min(1).max(80)).max(30).optional(),
    isPublic: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.headline !== undefined ||
      value.bio !== undefined ||
      value.avatarUrl !== undefined ||
      value.primaryCity !== undefined ||
      value.verticals !== undefined ||
      value.roles !== undefined ||
      value.capabilities !== undefined ||
      value.isPublic !== undefined,
    { message: 'At least one field required' },
  );

export const CreativeRoleAssignmentSchema = z.object({
  role: z.enum(PERSON_ROLE_TYPES),
  entityType: z.string().min(1).max(60).nullable().optional(),
  entityId: z.string().min(1).max(120).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});
