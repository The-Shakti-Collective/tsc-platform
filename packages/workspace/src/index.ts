export {
  WORKSPACE_TYPES,
  WORKSPACE_MEMBER_ROLES,
  WORKSPACE_MEMBER_STATUSES,
  WORKSPACE_TYPE_LABELS,
  WORKSPACE_MEMBER_ROLE_LABELS,
  WORKSPACE_ROUTE_PREFIX,
  WORKSPACE_MODELS,
  workspaceSlugWhere,
  workspaceOwnerWhere,
  workspaceMemberWhere,
  activeWorkspaceMembersWhere,
  personalWorkspaceWhere,
  workspaceInclude,
  workspaceMemberInclude,
  slugifyWorkspace,
  defaultPersonalWorkspaceName,
  canManageWorkspaceMembers,
  parseWorkspaceSettings,
  extractWorkspaceIdentityLink,
  type WorkspaceTypeValue,
  type WorkspaceMemberRoleValue,
  type WorkspaceMemberStatusValue,
  type WorkspaceIdentityLink,
} from '@tsc/database';

export {
  WorkspaceCreateSchema,
  WorkspaceSettingsPatchSchema,
  WorkspaceMemberAddSchema,
  WorkspaceMemberPatchSchema,
  WorkspaceTeamCreateSchema,
  WorkspaceSlugParamSchema,
} from '@tsc/contracts';

export type {
  WorkspaceSummary,
  WorkspaceDetailPayload,
  WorkspaceMemberSummary,
  WorkspaceTeamSummary,
  WorkspaceCreateInput,
  WorkspaceCreatePayload,
  WorkspaceMembersPayload,
  WorkspaceTeamsPayload,
} from '@tsc/types';

export function buildWorkspaceRoute(slug?: string): string {
  if (!slug) return '/workspace';
  return `/workspace/${slug}`;
}

export function buildWorkspaceTeamsRoute(slug: string): string {
  return `/workspace/${slug}/teams`;
}

export function buildWorkspaceSettingsRoute(slug: string): string {
  return `/workspace/${slug}/settings`;
}

export function buildWorkspaceApiPath(segment = ''): string {
  const normalized = segment.startsWith('/') ? segment : segment ? `/${segment}` : '';
  return `/api/workspace${normalized}`;
}
