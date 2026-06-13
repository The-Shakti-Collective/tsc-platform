import type {
  SkillCategoryValue,
  SkillEndorsementSourceValue,
  SkillProficiencyValue,
} from '@tsc/database';

export type SkillCategory = SkillCategoryValue;
export type SkillProficiency = SkillProficiencyValue;
export type SkillEndorsementSource = SkillEndorsementSourceValue;

export interface SkillRecord {
  id: string;
  slug: string;
  name: string;
  category: SkillCategory;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeIdentitySkillEntry {
  skillId: string;
  skillSlug: string;
  skillName: string;
  category: SkillCategory;
  proficiency: SkillProficiency;
  yearsExperience: number | null;
  isPrimary: boolean;
  endorsementCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillsListPayload {
  items: SkillRecord[];
  total: number;
  category: SkillCategory | null;
}

export interface SkillDetailPayload {
  skill: SkillRecord;
  creatorCount: number;
}

export interface CreativeIdentitySkillsPayload {
  slug: string;
  creativeIdentityId: string;
  displayName: string;
  primaryCity: string | null;
  skills: CreativeIdentitySkillEntry[];
  updatedAt: string;
}

export interface SkillCreatorsPayload {
  skill: SkillRecord;
  city: string | null;
  creators: SkillCreatorSummary[];
  total: number;
}

export interface SkillCreatorSummary {
  creativeIdentityId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  primaryCity: string | null;
  proficiency: SkillProficiency;
  yearsExperience: number | null;
  isPrimary: boolean;
  endorsementCount: number;
  routePath: string;
}

export interface AddCreativeIdentitySkillInput {
  skillSlug: string;
  proficiency?: SkillProficiency;
  yearsExperience?: number | null;
  isPrimary?: boolean;
}

export interface EndorseSkillInput {
  creativeIdentitySlug: string;
}

export interface EndorseSkillPayload {
  endorsementId: string;
  skillSlug: string;
  creativeIdentitySlug: string;
  source: SkillEndorsementSource;
  weight: number;
  createdAt: string;
}
