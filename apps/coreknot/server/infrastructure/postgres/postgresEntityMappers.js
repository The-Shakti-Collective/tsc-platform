const STAGE_TO_LEAD_STATUS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Warm',
  proposal: 'Proposal',
  won: 'Converted',
  lost: 'Lost',
};

const TASK_STATUS_TO_LEGACY = {
  todo: 'todo',
  in_progress: 'in-progress',
  blocked: 'blocked',
  done: 'done',
};

const TASK_PRIORITY_TO_LEGACY = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'critical',
};

const PROJECT_STATUS_TO_LEGACY = {
  planning: 'active',
  active: 'active',
  on_hold: 'active',
  completed: 'completed',
  archived: 'archived',
};

function asObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function mapProjectRow(row, { mongoId, tenantId, members = [], workspaceLabel } = {}) {
  const meta = asObject(row.metadata);
  return {
    _id: mongoId || row.id,
    id: mongoId || row.id,
    name: row.name,
    description: row.description ?? undefined,
    outletId: meta.outletId ?? 'default',
    owner: members.find((m) => m.role === 'owner')?.mongoUserId ?? members[0]?.mongoUserId,
    members: members.map((m) => m.mongoUserId).filter(Boolean),
    memberRoles: members
      .filter((m) => m.mongoUserId)
      .map((m) => ({ user: m.mongoUserId, role: m.role === 'owner' ? 'owner' : 'member' })),
    status: PROJECT_STATUS_TO_LEGACY[row.status] ?? 'active',
    tags: meta.tags ?? [],
    progress: meta.progress ?? 0,
    totalTasksCount: meta.totalTasksCount ?? 0,
    completedTasksCount: meta.completedTasksCount ?? 0,
    linkedCalendars: meta.linkedCalendars ?? [],
    color: meta.color ?? '#3b82f6',
    workspace: workspaceLabel || meta.legacyWorkspaceLabel || 'GENERAL',
    starred: meta.starred ?? false,
    tenantId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    _readSource: 'postgres',
  };
}

function mapTaskRow(row, {
  mongoId,
  tenantId,
  assigneeMongoIds = [],
  createdByMongoId,
  projectMongoId,
  workspaceLabel,
} = {}) {
  const meta = asObject(row.metadata);
  return {
    _id: mongoId || row.id,
    id: mongoId || row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: meta.legacyStatus || TASK_STATUS_TO_LEGACY[row.status] || 'todo',
    priority: TASK_PRIORITY_TO_LEGACY[row.priority] || 'medium',
    type: meta.taskType ?? '',
    scheduleSlot: meta.scheduleSlot ?? 'FULL',
    scheduleDate: meta.scheduleDate ? new Date(meta.scheduleDate) : undefined,
    projectId: projectMongoId ?? (meta.projectId || undefined),
    workspace: workspaceLabel || meta.legacyWorkspaceLabel || 'GENERAL',
    phaseId: meta.phaseId ?? undefined,
    parentTaskId: meta.parentTaskId ?? undefined,
    dueDate: row.dueAt ?? undefined,
    plannedHours: meta.plannedHours ?? 0,
    actualHours: meta.actualHours ?? 0,
    dependencies: meta.dependencies ?? [],
    createdBy: createdByMongoId ?? undefined,
    mentionAccessIds: meta.mentionPersonIds ?? [],
    tenantId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    _readSource: 'postgres',
  };
}

function mapLeadRow(row, { mongoId, tenantId, assignedRepMongoId } = {}) {
  const meta = asObject(row.metadata);
  const legacyStatus = meta.legacyLeadStatus
    || STAGE_TO_LEAD_STATUS[row.stage]
    || 'New';

  let notes = [];
  if (Array.isArray(meta.notes)) notes = meta.notes;
  else if (row.notes) notes = [{ text: row.notes, author: 'system', date: row.updatedAt }];

  const lock = asObject(meta.lock);

  return {
    _id: mongoId || row.id,
    id: mongoId || row.id,
    tenantId,
    personId: meta.personId ?? undefined,
    rowId: meta.rowId ?? undefined,
    customerIdExly: meta.exly?.customerIdExly ?? meta.customerIdExly ?? undefined,
    transactionIdExly: meta.exly?.transactionIdExly ?? meta.transactionIdExly ?? undefined,
    exlyOfferingId: meta.exly?.exlyOfferingId ?? meta.exlyOfferingId ?? undefined,
    exlyOfferingTitle: meta.exly?.exlyOfferingTitle ?? meta.exlyOfferingTitle ?? undefined,
    exlyOfferings: meta.exly?.exlyOfferings ?? meta.exlyOfferings ?? [],
    crmType: meta.crmType ?? 'sales',
    artistProject: meta.artistProject ?? undefined,
    contactCategory: meta.contactCategory ?? undefined,
    name: row.name,
    nameKey: meta.nameKey ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    city: meta.city ?? undefined,
    webinarDates: meta.webinarDates ?? undefined,
    attended: meta.attended ?? undefined,
    attendanceDurationMin: meta.attendanceDurationMin ?? undefined,
    qnaAnswered: meta.qnaAnswered ?? undefined,
    artistType: meta.artistType ?? undefined,
    fullTimeWillingness: meta.fullTimeWillingness ?? undefined,
    primaryRole: meta.primaryRole ?? undefined,
    learningGoal: meta.learningGoal ?? undefined,
    learnedMusic: meta.learnedMusic ?? undefined,
    currentJourney: meta.currentJourney ?? undefined,
    source: row.source ?? 'Organic / Direct',
    meaningfulConnect: meta.meaningfulConnect ?? 'PENDING',
    leadQuality: meta.leadQuality ?? '1',
    callStatus: meta.callStatus ?? 'Pending',
    leadStatus: legacyStatus,
    remarks: meta.remarks ?? undefined,
    notes,
    planOption: meta.planOption ?? undefined,
    nextFollowupDate: meta.nextFollowupDate ?? undefined,
    nextFollowupTime: meta.nextFollowupTime ?? undefined,
    setReminder: meta.setReminder ?? false,
    assignedRepId: assignedRepMongoId ?? meta.assignedRepId ?? undefined,
    createdBy: meta.createdBy ?? undefined,
    importId: meta.importId ?? undefined,
    metadata: meta,
    tags: meta.tags ?? [],
    emailStatus: meta.emailStatus ?? 'Pending',
    bounceCount: meta.bounceCount ?? 0,
    unsubscribed: meta.unsubscribed ?? false,
    unsubscribeReason: meta.unsubscribeReason ?? undefined,
    status: meta.status ?? 'active',
    location: meta.location ?? undefined,
    reminderSent: meta.reminderSent ?? false,
    notifiedOverdue: meta.notifiedOverdue ?? false,
    lockedBy: lock.lockedBy ?? meta.lockedBy ?? undefined,
    lockedAt: lock.lockedAt ? new Date(lock.lockedAt) : (meta.lockedAt ? new Date(meta.lockedAt) : undefined),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    _readSource: 'postgres',
  };
}

module.exports = {
  mapProjectRow,
  mapTaskRow,
  mapLeadRow,
  STAGE_TO_LEAD_STATUS,
  TASK_STATUS_TO_LEGACY,
};
