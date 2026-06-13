import {
  buildCreativeRoutePath,
  resolveProficiency,
  type SkillCategoryValue,
  type SkillProficiencyValue,
} from '@tsc/database';
import type {
  CreativeIdentitySkillEntry,
  CreativeIdentitySkillsPayload,
  EndorseSkillPayload,
  SkillCreatorSummary,
  SkillCreatorsPayload,
  SkillDetailPayload,
  SkillRecord,
  SkillsListPayload,
} from '@tsc/types';
import type {
  CreativeIdentityLookup,
  IdentitySkillRow,
  SkillRow,
} from './skills.repository';

export function toSkillRecord(row: SkillRow): SkillRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as SkillCategoryValue,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toSkillsListPayload(
  rows: SkillRow[],
  category: SkillCategoryValue | null,
): SkillsListPayload {
  return {
    items: rows.map(toSkillRecord),
    total: rows.length,
    category,
  };
}

export function toSkillDetailPayload(row: SkillRow, creatorCount: number): SkillDetailPayload {
  return {
    skill: toSkillRecord(row),
    creatorCount,
  };
}

export function toCreativeIdentitySkillEntry(
  row: IdentitySkillRow,
  endorsementCount = 0,
): CreativeIdentitySkillEntry {
  const skill = row.skill!;
  return {
    skillId: row.skillId,
    skillSlug: skill.slug,
    skillName: skill.name,
    category: skill.category as SkillCategoryValue,
    proficiency: row.proficiency as SkillProficiencyValue,
    yearsExperience: row.yearsExperience,
    isPrimary: row.isPrimary,
    endorsementCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toCreativeIdentitySkillsPayload(
  identity: CreativeIdentityLookup,
  rows: IdentitySkillRow[],
  endorsementCounts: Record<string, number>,
): CreativeIdentitySkillsPayload {
  return {
    slug: identity.slug,
    creativeIdentityId: identity.id,
    displayName: identity.displayName,
    primaryCity: identity.primaryCity,
    skills: rows.map((row) =>
      toCreativeIdentitySkillEntry(row, endorsementCounts[row.skillId] ?? 0),
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function toSkillCreatorSummary(
  row: IdentitySkillRow,
  endorsementCount = 0,
): SkillCreatorSummary {
  const identity = row.creativeIdentity!;
  return {
    creativeIdentityId: identity.id,
    slug: identity.slug,
    displayName: identity.displayName,
    headline: identity.headline,
    primaryCity: identity.primaryCity,
    proficiency: row.proficiency as SkillProficiencyValue,
    yearsExperience: row.yearsExperience,
    isPrimary: row.isPrimary,
    endorsementCount,
    routePath: buildCreativeRoutePath(identity.slug, 'creator'),
  };
}

export function toSkillCreatorsPayload(
  skill: SkillRow,
  rows: IdentitySkillRow[],
  city: string | null,
  endorsementCounts: Record<string, number>,
): SkillCreatorsPayload {
  return {
    skill: toSkillRecord(skill),
    city,
    creators: rows.map((row) =>
      toSkillCreatorSummary(row, endorsementCounts[`${row.creativeIdentityId}:${row.skillId}`] ?? 0),
    ),
    total: rows.length,
  };
}

export function toEndorseSkillPayload(
  endorsementId: string,
  skillSlug: string,
  creativeIdentitySlug: string,
): EndorseSkillPayload {
  return {
    endorsementId,
    skillSlug,
    creativeIdentitySlug,
    source: 'peer',
    weight: 1,
    createdAt: new Date().toISOString(),
  };
}

export function buildCapabilityCompatFromSkills(
  skills: CreativeIdentitySkillEntry[],
): string[] {
  return skills
    .filter((skill) => skill.isPrimary)
    .map((skill) => skill.skillSlug)
    .concat(skills.filter((skill) => !skill.isPrimary).map((skill) => skill.skillSlug))
    .slice(0, 12);
}

export { resolveProficiency };
