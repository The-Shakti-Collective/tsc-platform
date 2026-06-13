export {
  PROJECT_TYPES,
  PROJECT_STATUSES,
  PROJECT_MEMBER_ROLES,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_MEMBER_ROLE_LABELS,
  PROJECT_MODELS,
  projectWorkspaceSlugWhere,
  projectsByWorkspaceWhere,
  projectInclude,
  projectMemberInclude,
  slugifyProject,
  canManageProject,
  type ProjectTypeValue,
  type ProjectStatusValue,
  type ProjectMemberRoleValue,
} from '@tsc/database';

export {
  ProjectTypeSchema,
  ProjectStatusSchema,
  ProjectMemberRoleSchema,
  ProjectCreateSchema,
  ProjectPatchSchema,
  ProjectMemberAddSchema,
  WorkspaceProjectSlugParamSchema,
} from '@tsc/contracts';

export type {
  ProjectSummary,
  ProjectDetailPayload,
  ProjectMemberSummary,
  ProjectCreateInput,
  ProjectPatchInput,
  ProjectMemberAddInput,
  ProjectsListPayload,
  ProjectMembersPayload,
} from '@tsc/types';

export function buildProjectsRoute(workspaceSlug: string): string {
  return `/workspace/${workspaceSlug}/projects`;
}

export function buildProjectDetailRoute(workspaceSlug: string, projectSlug: string): string {
  return `/workspace/${workspaceSlug}/projects/${projectSlug}`;
}

export function buildProjectApiPath(workspaceSlug: string, segment = ''): string {
  const normalized = segment.startsWith('/') ? segment : segment ? `/${segment}` : '';
  return `/api/workspace/${workspaceSlug}/projects${normalized}`;
}
