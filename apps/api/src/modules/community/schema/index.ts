import { z } from 'zod';

export const CommunityMemberRoleSchema = z
  .enum(['Founder', 'Moderator', 'Member', 'Contributor', 'Leader'])
  .transform((role) => (role === 'Leader' ? 'Founder' : role));

export const CommunityMemberStatusSchema = z.enum([
  'active',
  'left',
  'banned',
  'pending',
]);

export const CommunityMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
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

export const CommunityCreateOpportunitySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z
    .enum([
      'scholarship',
      'residency',
      'brand_deal',
      'festival_slot',
      'workshop',
      'collaboration',
      'open_call',
      'funding',
    ])
    .optional(),
  value: z.number().nonnegative().optional(),
  deadline: z.string().datetime().optional(),
  marketplaceVisible: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const CommunityLeaderSettingsSchema = z.object({
  inviteOnly: z.boolean().optional(),
  memberPosting: z.boolean().optional(),
  eventCreation: z.boolean().optional(),
  opportunityPosting: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CommunityMembersQuery = z.infer<typeof CommunityMembersQuerySchema>;
export type CommunityAddMemberInput = z.infer<typeof CommunityAddMemberSchema>;
export type CommunityCreateOpportunityInput = z.infer<
  typeof CommunityCreateOpportunitySchema
>;
export type CommunityLeaderSettingsInput = z.infer<
  typeof CommunityLeaderSettingsSchema
>;
export type CommunityMemberRolePatchInput = z.infer<
  typeof CommunityMemberRolePatchSchema
>;
