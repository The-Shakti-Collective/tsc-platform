import { apiGet, apiPatch, apiPost, getTscApiBase, resolveApiPath } from './apiClient';

export function getWorkspaceApiBase() {
  return getTscApiBase();
}

function workspacePath(segment = '') {
  return resolveApiPath('/api/workspace', segment);
}

export async function fetchMyWorkspace() {
  return apiGet(workspacePath('/me'));
}

export async function fetchWorkspace(slug) {
  return apiGet(workspacePath(`/${slug}`));
}

export async function fetchWorkspaceMembers(slug) {
  return apiGet(workspacePath(`/${slug}/members`));
}

export async function fetchWorkspaceTeams(slug) {
  return apiGet(workspacePath(`/${slug}/teams`));
}

export async function createWorkspace(payload) {
  return apiPost(workspacePath(''), payload);
}

export async function patchWorkspaceSettings(slug, payload) {
  return apiPatch(workspacePath(`/${slug}`), payload);
}

export async function inviteWorkspaceMember(slug, payload) {
  return apiPost(workspacePath(`/${slug}/members`), payload);
}

export async function createWorkspaceTeam(slug, payload) {
  return apiPost(workspacePath(`/${slug}/teams`), payload);
}

export const WORKSPACE_TYPE_LABELS = {
  artist: 'Artist',
  manager: 'Manager',
  team: 'Team',
  community_leader: 'Community Leader',
  agency: 'Agency',
  personal: 'Personal',
};

export const WORKSPACE_ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  guest: 'Guest',
};
