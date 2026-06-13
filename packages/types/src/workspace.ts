import type {
  WorkspaceMemberRoleValue,
  WorkspaceMemberStatusValue,
  WorkspaceTypeValue,
} from '@tsc/database';

export type WorkspaceType = WorkspaceTypeValue;
export type WorkspaceMemberRole = WorkspaceMemberRoleValue;
export type WorkspaceMemberStatus = WorkspaceMemberStatusValue;

export interface WorkspaceIdentityLink {
  tscIdentitySlug: string | null;
  tscIdentityNamespace: 'fan' | 'artist' | null;
}

export interface WorkspaceMemberSummary {
  id: string;
  personId: string;
  displayName: string;
  slug: string | null;
  role: WorkspaceMemberRole;
  status: WorkspaceMemberStatus;
  joinedAt: string;
}

export interface WorkspaceTeamSummary {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export interface WorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  ownerPersonId: string;
  type: WorkspaceType;
  settings: Record<string, unknown>;
  identityLink: WorkspaceIdentityLink;
  memberCount: number;
  teamCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDetailPayload extends WorkspaceSummary {
  members: WorkspaceMemberSummary[];
  teams: WorkspaceTeamSummary[];
}

export interface WorkspaceCreateInput {
  name: string;
  slug?: string;
  type?: WorkspaceType;
  settings?: Record<string, unknown>;
}

export interface WorkspaceCreatePayload {
  workspace: WorkspaceSummary;
  created: boolean;
}

export interface WorkspaceSettingsPatchInput {
  name?: string;
  settings?: Record<string, unknown>;
}

export interface WorkspaceMemberAddInput {
  personId: string;
  role?: WorkspaceMemberRole;
}

export interface WorkspaceMemberPatchInput {
  role: WorkspaceMemberRole;
}

export interface WorkspaceTeamCreateInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface WorkspaceMembersPayload {
  workspaceSlug: string;
  items: WorkspaceMemberSummary[];
  updatedAt: string;
}

export interface WorkspaceTeamsPayload {
  workspaceSlug: string;
  items: WorkspaceTeamSummary[];
  updatedAt: string;
}
