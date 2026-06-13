import { z } from 'zod';
import { DEFAULT_MEMBERS_PAGE_SIZE } from '@tsc/constants';

export const CommunityMemberRoleSchema = z
  .enum(['Founder', 'Admin', 'Moderator', 'Member', 'Contributor', 'Leader'])
  .transform((role) => (role === 'Leader' ? 'Founder' : role));

export const CommunityMemberStatusSchema = z.enum([
  'active',
  'left',
  'banned',
  'pending',
]);

export const CommunityMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(DEFAULT_MEMBERS_PAGE_SIZE),
  role: CommunityMemberRoleSchema.optional(),
  status: CommunityMemberStatusSchema.optional(),
});

export const CommunityAddMemberSchema = z.object({
  personId: z.string().min(1),
  role: CommunityMemberRoleSchema.optional().default('Member'),
});

export const CommunityMemberRolePatchSchema = z.object({
  role: CommunityMemberRoleSchema,
});
