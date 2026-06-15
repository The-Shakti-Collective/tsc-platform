/** Status / role maps from docs/migration/02-schema-mapping.md */

/** @type {Record<string, import('@prisma/client').PlatformRole>} */
export const DEPARTMENT_PRESET_TO_ROLE = {
  admin: 'SUPER_ADMIN',
  ops: 'MANAGER',
  operations: 'MANAGER',
  sales: 'MANAGER',
  'artist-management': 'MANAGER',
  creative: 'TEAM_MEMBER',
  standard: 'TEAM_MEMBER',
};

/** @type {Record<string, import('@prisma/client').LeadPipelineStage>} */
export const LEAD_STATUS_TO_STAGE = {
  new: 'new',
  fresh: 'new',
  contacted: 'contacted',
  connected: 'contacted',
  busy: 'contacted',
  dnp: 'contacted',
  warm: 'qualified',
  hot: 'qualified',
  interested: 'qualified',
  qualified: 'qualified',
  'in progress': 'qualified',
  proposal: 'proposal',
  followup: 'proposal',
  converted: 'won',
  'already purchased': 'won',
  'token received': 'won',
  lost: 'lost',
  'not interested': 'lost',
  cold: 'lost',
};

/** @type {Record<string, import('@prisma/client').InquiryStatus>} */
export const INQUIRY_STATUS_MAP = {
  new: 'open',
  contacted: 'in_progress',
  negotiating: 'in_progress',
  verbal_confirmation: 'resolved',
  contract_sent: 'resolved',
  confirmed: 'resolved',
  completed: 'resolved',
  paid: 'resolved',
  blocked: 'closed',
  dead: 'closed',
};

/** @type {Record<string, import('@prisma/client').TaskStatus>} */
export const TASK_STATUS_MAP = {
  todo: 'todo',
  'to do': 'todo',
  'in-progress': 'in_progress',
  'in progress': 'in_progress',
  'in-review': 'in_progress',
  review: 'in_progress',
  done: 'done',
  blocked: 'blocked',
};

/** @type {Record<string, import('@prisma/client').TaskPriority>} */
export const TASK_PRIORITY_MAP = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'urgent',
};

/** @type {Record<string, import('@prisma/client').ProjectStatus>} */
export const PROJECT_STATUS_MAP = {
  active: 'active',
  archived: 'archived',
  completed: 'completed',
};

/** @type {Record<string, import('@prisma/client').GigStatus>} */
export const GIG_STATUS_FROM_PAYMENT = {
  pending: 'tentative',
  partial: 'confirmed',
  paid: 'completed',
};

export function mapLeadStage(raw) {
  if (!raw) return { stage: 'new', legacy: null };
  const key = String(raw).trim().toLowerCase();
  const stage = LEAD_STATUS_TO_STAGE[key];
  if (stage) return { stage, legacy: null };
  return { stage: 'new', legacy: String(raw) };
}

export function mapInquiryStatus(raw) {
  if (!raw) return { status: 'open', legacy: null };
  const key = String(raw).trim().toLowerCase();
  const status = INQUIRY_STATUS_MAP[key];
  if (status) return { status, legacy: null };
  return { status: 'open', legacy: String(raw) };
}

export function mapDepartmentRole(preset) {
  if (!preset) return 'TEAM_MEMBER';
  return DEPARTMENT_PRESET_TO_ROLE[String(preset).toLowerCase()] ?? 'TEAM_MEMBER';
}
