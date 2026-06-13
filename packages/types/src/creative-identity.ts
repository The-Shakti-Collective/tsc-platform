import type { CreativeRoleTagValue, CreativeVerticalValue } from '@tsc/database';
import type { CreativeIdentitySkillEntry } from './skills.js';

export type CreativeVertical = CreativeVerticalValue;
export type CreativeRoleTag = CreativeRoleTagValue;

export interface CreativeIdentityRecord {
  id: string;
  personId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  primaryCity: string | null;
  verticals: CreativeVertical[];
  roles: CreativeRoleTag[];
  /** @deprecated Replaced by structured skills graph — populated from primary skill slugs for compat */
  capabilities: string[];
  skills: CreativeIdentitySkillEntry[];
  isPublic: boolean;
  verificationLevel: number;
  trustScoreStub: number | null;
  ecosystemScoreStub: number | null;
  shareUrl: string;
  routePath: string;
  alternateRoutePath: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeIdentityPublicPayload {
  identity: CreativeIdentityRecord;
  entityRoles: CreativeEntityRoleEntry[];
}

export interface CreativeEntityRoleEntry {
  id: string;
  role: string;
  status: string;
  entityType: string | null;
  entityId: string | null;
  label: string | null;
  assignedAt: string;
  metadata: Record<string, unknown>;
}

export interface CreativeIdentityRolesPayload {
  slug: string;
  personId: string;
  roles: CreativeEntityRoleEntry[];
  updatedAt: string;
}

export interface CreativeIdentityPatchInput {
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  primaryCity?: string | null;
  verticals?: CreativeVertical[];
  roles?: CreativeRoleTag[];
  /** @deprecated Use POST /creative-identity/me/skills */
  capabilities?: string[];
  isPublic?: boolean;
}

export interface CreativeRoleAssignmentInput {
  role: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreativeIdentityMergeSummary {
  slug: string;
  displayName: string;
  headline: string | null;
  verticals: CreativeVertical[];
  roles: CreativeRoleTag[];
  /** @deprecated Replaced by structured skills graph — populated from primary skill slugs for compat */
  capabilities: string[];
  skills: CreativeIdentitySkillEntry[];
  shareUrl: string;
  routePath: string;
}
