import { apiGet, apiPatch, apiPost, resolveApiPath } from './apiClient';
import { getWorkspaceApiBase } from './workspaceApi';

export { getWorkspaceApiBase };

function projectPath(workspaceSlug, segment = '') {
  return resolveApiPath(`/api/workspace/${workspaceSlug}/projects`, segment);
}

export async function fetchProjects(workspaceSlug) {
  return apiGet(projectPath(workspaceSlug));
}

export async function fetchProject(workspaceSlug, projectSlug) {
  return apiGet(projectPath(workspaceSlug, `/${projectSlug}`));
}

export async function createProject(workspaceSlug, payload) {
  return apiPost(projectPath(workspaceSlug), payload);
}

export async function patchProject(workspaceSlug, projectSlug, payload) {
  return apiPatch(projectPath(workspaceSlug, `/${projectSlug}`), payload);
}

export async function archiveProject(workspaceSlug, projectSlug) {
  return apiPost(projectPath(workspaceSlug, `/${projectSlug}/archive`), {});
}

export async function fetchProjectMembers(workspaceSlug, projectSlug) {
  return apiGet(projectPath(workspaceSlug, `/${projectSlug}/members`));
}

export async function addProjectMember(workspaceSlug, projectSlug, payload) {
  return apiPost(projectPath(workspaceSlug, `/${projectSlug}/members`), payload);
}

export const PROJECT_STATUS_LABELS = {
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  archived: 'Archived',
};

export const PROJECT_TYPE_LABELS = {
  general: 'General',
  release: 'Release',
  tour: 'Tour',
  campaign: 'Campaign',
  content: 'Content',
  collaboration: 'Collaboration',
};

export const PROJECT_VISIBILITY_LABELS = {
  workspace: 'Workspace',
  private: 'Private',
};
