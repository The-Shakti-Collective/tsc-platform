import { apiDelete, apiGet, apiPatch, apiPost, resolveApiPath } from './apiClient';

function taskPath(workspaceSlug, segment = '') {
  return resolveApiPath(`/api/workspace/${workspaceSlug}/tasks`, segment);
}

export async function fetchTasks(workspaceSlug, params = {}) {
  return apiGet(taskPath(workspaceSlug), { params });
}

export async function fetchTask(workspaceSlug, taskId) {
  return apiGet(taskPath(workspaceSlug, `/${taskId}`));
}

export async function createTask(workspaceSlug, payload) {
  return apiPost(taskPath(workspaceSlug), payload);
}

export async function patchTask(workspaceSlug, taskId, payload) {
  return apiPatch(taskPath(workspaceSlug, `/${taskId}`), payload);
}

export async function deleteTask(workspaceSlug, taskId) {
  return apiDelete(taskPath(workspaceSlug, `/${taskId}`));
}

export async function addTaskComment(workspaceSlug, taskId, payload) {
  return apiPost(taskPath(workspaceSlug, `/${taskId}/comments`), payload);
}

export async function addChecklistItem(workspaceSlug, taskId, payload) {
  return apiPost(taskPath(workspaceSlug, `/${taskId}/checklist`), payload);
}

export async function patchChecklistItem(workspaceSlug, taskId, itemId, payload) {
  return apiPatch(taskPath(workspaceSlug, `/${taskId}/checklist/${itemId}`), payload);
}

export const TASK_STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

export const TASK_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TASK_BOARD_COLUMNS = ['todo', 'in_progress', 'blocked', 'done'];

export const TASK_STATUS_COLORS = {
  todo: 'border-slate-300 bg-slate-50',
  in_progress: 'border-blue-300 bg-blue-50',
  blocked: 'border-amber-300 bg-amber-50',
  done: 'border-emerald-300 bg-emerald-50',
};

export const TASK_PRIORITY_COLORS = {
  low: 'text-slate-500',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};
