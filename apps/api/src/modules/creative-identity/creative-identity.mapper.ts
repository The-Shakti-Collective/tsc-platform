import type {
  CreativeEntityRoleEntry,
  CreativeIdentityPatchInput,
  CreativeIdentityPublicPayload,
  CreativeIdentityRecord,
  CreativeIdentityRolesPayload,
  CreativeIdentitySkillEntry,
} from '@tsc/types';
import type { CreativeIdentityRow, PersonRoleRow } from './creative-identity.repository';
import {
  buildCreativeRoutePath,
  buildCreativeShareUrl,
  filterCreativeRoleTags,
  filterCreativeVerticals,
} from '@tsc/database';

export type { CreativeIdentityPatchInput };

function buildCapabilitiesCompat(skills: CreativeIdentitySkillEntry[], legacy: string[]): string[] {
  if (skills.length > 0) {
    return skills
      .filter((skill) => skill.isPrimary)
      .map((skill) => skill.skillSlug)
      .concat(skills.filter((skill) => !skill.isPrimary).map((skill) => skill.skillSlug))
      .slice(0, 12);
  }
  return legacy;
}

export function toCreativeIdentityRecord(
  row: CreativeIdentityRow,
  skills: CreativeIdentitySkillEntry[] = [],
): CreativeIdentityRecord {
  return {
    id: row.id,
    personId: row.personId,
    slug: row.slug,
    displayName: row.displayName,
    headline: row.headline,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    primaryCity: row.primaryCity,
    verticals: filterCreativeVerticals(row.verticals),
    roles: filterCreativeRoleTags(row.roles),
    capabilities: buildCapabilitiesCompat(skills, row.capabilities),
    skills,
    isPublic: row.isPublic,
    verificationLevel: row.verificationLevel,
    trustScoreStub: row.trustScoreStub,
    ecosystemScoreStub: row.ecosystemScoreStub,
    shareUrl: buildCreativeShareUrl(row.slug),
    routePath: buildCreativeRoutePath(row.slug, 'creator'),
    alternateRoutePath: buildCreativeRoutePath(row.slug, 'creative'),
    metadata: parseMetadata(row.metadata),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toEntityRoleEntry(row: PersonRoleRow): CreativeEntityRoleEntry {
  return {
    id: row.id,
    role: row.role,
    status: row.status,
    entityType: row.entityType,
    entityId: row.entityId,
    label: row.role.replace(/_/g, ' '),
    assignedAt: row.assignedAt.toISOString(),
    metadata: parseMetadata(row.metadata),
  };
}

export function toPublicPayload(
  row: CreativeIdentityRow,
  entityRoles: PersonRoleRow[],
  skills: CreativeIdentitySkillEntry[] = [],
): CreativeIdentityPublicPayload {
  return {
    identity: toCreativeIdentityRecord(row, skills),
    entityRoles: entityRoles.map(toEntityRoleEntry),
  };
}

export function toRolesPayload(
  slug: string,
  personId: string,
  entityRoles: PersonRoleRow[],
): CreativeIdentityRolesPayload {
  return {
    slug,
    personId,
    roles: entityRoles.map(toEntityRoleEntry),
    updatedAt: new Date().toISOString(),
  };
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
