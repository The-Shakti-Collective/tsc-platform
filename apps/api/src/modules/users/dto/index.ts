import { z } from 'zod';

export const UserListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const UserCreateSchema = z.object({
  clerkUserId: z.string().min(1),
  personId: z.string().min(1),
  platformRole: z
    .enum([
      'SUPER_ADMIN',
      'ORG_OWNER',
      'MANAGER',
      'ARTIST',
      'TEAM_MEMBER',
      'CLIENT',
      'FAN',
    ])
    .optional(),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
