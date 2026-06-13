import { z } from 'zod';
import { IdentityMergeReasonSchema, PersonRoleTypeSchema } from './enums.js';

export const IncomingIdentifierSchema = z.object({
  provider: z.enum([
    'email',
    'phone',
    'instagram',
    'spotify',
    'tiktok',
    'twitter',
    'community_account',
    'coreknot_user',
    'website',
    'other',
  ]),
  externalId: z.string().min(1),
  verified: z.boolean().optional(),
  primary: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ResolveIdentitySchema = z.object({
  identifiers: z.array(IncomingIdentifierSchema).min(1),
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  roles: z
    .array(
      z.object({
        role: PersonRoleTypeSchema,
        entityType: z.string().min(1).optional(),
        entityId: z.string().min(1).optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .optional(),
  createIfMissing: z.boolean().optional().default(true),
  source: z.string().min(1).optional(),
});

export const MergeIdentitySchema = z.object({
  survivorPersonId: z.string().min(1),
  mergedPersonIds: z.array(z.string().min(1)).min(1),
  reason: IdentityMergeReasonSchema.optional().default('manual'),
  mergedBy: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const PersonUpdateSchema = z
  .object({
    name: z.string().min(1).max(120).nullable().optional(),
    displayName: z.string().min(1).max(120).nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().min(5).max(30).nullable().optional(),
  })
  .strict();
