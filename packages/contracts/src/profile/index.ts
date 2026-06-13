import { z } from 'zod';

export const ProfileLinkSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().url().max(500),
});

export const ProfileSlugParamSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
});

export const ProfileEditSchema = z
  .object({
    bio: z.string().max(4000).nullable().optional(),
    city: z.string().max(120).nullable().optional(),
    genres: z.array(z.string().min(1).max(60)).max(20).optional(),
    skills: z.array(z.string().min(1).max(60)).max(30).optional(),
    links: z.array(ProfileLinkSchema).max(12).optional(),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9_]+$/i)
      .nullable()
      .optional(),
  })
  .strict();

export const UsernameCheckSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9_]+$/i),
  })
  .strict();

export const CommunityVerificationRequestSchema = z
  .object({
    communityId: z.string().min(1).optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

export const AdminVerificationPatchSchema = z
  .object({
    level: z.literal(4),
    adminVerified: z.boolean().optional(),
  })
  .strict();
