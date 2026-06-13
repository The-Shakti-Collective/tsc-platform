import { z } from 'zod';
import {
  SKILL_CATEGORIES,
  SKILL_ENDORSEMENT_SOURCES,
  SKILL_PROFICIENCIES,
} from '@tsc/database';

export const SkillCategorySchema = z.enum(SKILL_CATEGORIES);

export const SkillProficiencySchema = z.enum(SKILL_PROFICIENCIES);

export const SkillEndorsementSourceSchema = z.enum(SKILL_ENDORSEMENT_SOURCES);

export const SkillSlugParamSchema = z.object({
  slug: z.string().min(1).max(80),
});

export const SkillIdParamSchema = z.object({
  skillId: z.string().min(1),
});

export const SkillsListQuerySchema = z.object({
  category: SkillCategorySchema.optional(),
});

export const SkillCreatorsQuerySchema = z.object({
  city: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const AddCreativeIdentitySkillSchema = z.object({
  skillSlug: z.string().min(1).max(80),
  proficiency: SkillProficiencySchema.optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).nullable().optional(),
  isPrimary: z.boolean().optional(),
});

export const EndorseSkillSchema = z.object({
  creativeIdentitySlug: z.string().min(1).max(80),
});
