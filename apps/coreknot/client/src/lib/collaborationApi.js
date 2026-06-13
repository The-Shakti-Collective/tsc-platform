import { apiGet, apiPost, apiPatch, resolveApiPath } from './apiClient';

function collaborationPath(segment = '') {
  return resolveApiPath('/api/collaborations', segment);
}

export function getTscCollaborationApiBase() {
  const base = resolveApiPath('/api/collaborations', '');
  return base.replace(/\/api\/collaborations$/, '') || '';
}

export const COLLABORATION_TYPES = [
  'production',
  'performance',
  'visual',
  'writing',
  'marketing',
  'other',
];

export const TYPE_LABELS = {
  production: 'Production',
  performance: 'Performance',
  visual: 'Visual',
  writing: 'Writing',
  marketing: 'Marketing',
  other: 'Other',
};

export const STATUS_LABELS = {
  open: 'Open',
  in_review: 'In review',
  matched: 'Matched',
  closed: 'Closed',
};

export const APPLICATION_STATUS_LABELS = {
  pending: 'Pending',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export async function fetchCollaborations(filters = {}) {
  return apiGet(collaborationPath(''), { params: filters });
}

export async function fetchCollaborationDetail(id) {
  return apiGet(collaborationPath(`/${id}`));
}

export async function createCollaboration(body) {
  return apiPost(collaborationPath(''), body);
}

export async function updateCollaboration(id, body) {
  return apiPatch(collaborationPath(`/${id}`), body);
}

export async function applyToCollaboration(id, body = {}) {
  return apiPost(collaborationPath(`/${id}/applications`), body);
}

export async function updateCollaborationApplication(collaborationId, applicationId, body) {
  return apiPatch(collaborationPath(`/${collaborationId}/applications/${applicationId}`), body);
}

export async function fetchMyCollaborations() {
  return apiGet(collaborationPath('/me/created'));
}

export async function fetchMyCollaborationApplications() {
  return apiGet(collaborationPath('/me/applications'));
}
