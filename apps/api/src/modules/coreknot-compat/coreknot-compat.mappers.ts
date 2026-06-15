type LeadItem = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  stage?: string;
  assignedPersonId?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ProjectSummaryLike = {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  type?: string;
  description?: string | null;
  memberCount?: number;
  taskCount?: number;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
};

type TaskSummaryLike = {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  projectId?: string | null;
  dueAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdByPersonId?: string;
};

const DEFAULT_WORKSPACES = [
  { name: 'TSC ACADEMY', color: '#3498db', order: 0 },
  { name: 'TSC ARTISTS', color: '#9b59b6', order: 1 },
  { name: 'TSC FILMS', color: '#e74c3c', order: 2 },
  { name: 'TSC TECH', color: '#2ecc71', order: 3 },
  { name: 'GENERAL', color: '#64748b', order: 4 },
];

export function toLegacyLead(lead: LeadItem) {
  return {
    _id: lead.id,
    id: lead.id,
    name: lead.name,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    source: lead.source ?? null,
    leadStatus: lead.stage ?? 'new',
    stage: lead.stage ?? 'new',
    assignedPersonId: lead.assignedPersonId ?? null,
    notes: lead.notes ?? null,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

export function toLegacyLeadList(payload: {
  items: LeadItem[];
  organizationId?: string;
}) {
  const leads = payload.items.map(toLegacyLead);
  return {
    leads,
    total: leads.length,
    page: 1,
    limit: leads.length || 50,
    totalPages: 1,
  };
}

export function toLegacyProject(
  project: ProjectSummaryLike,
  workspaceName = 'GENERAL',
) {
  const totalTasks = project.taskCount ?? 0;
  return {
    _id: project.id,
    id: project.id,
    name: project.name,
    slug: project.slug,
    status: project.status ?? 'active',
    type: project.type ?? 'general',
    description: project.description ?? null,
    workspace: workspaceName,
    progress: 0,
    totalTasks,
    completedTasks: 0,
    totalTasksCount: totalTasks,
    completedTasksCount: 0,
    starred: Boolean((project.metadata ?? {}).starred),
    members: [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function toLegacyTask(task: TaskSummaryLike) {
  const createdBy = task.createdByPersonId ?? null;
  return {
    _id: task.id,
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    status: task.status ?? 'todo',
    priority: task.priority ?? 'medium',
    projectId: task.projectId ?? null,
    dueDate: task.dueAt ?? null,
    dueAt: task.dueAt ?? null,
    createdBy,
    assignees: [],
    assigneeIds: [],
    assignments: [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function defaultLegacyWorkspaces() {
  return DEFAULT_WORKSPACES.map((workspace) => ({ ...workspace }));
}

export function emptyCrmStats() {
  return {
    totalLeads: 0,
    connected: 0,
    activeReach: 0,
    meaningful: 0,
    warmLeads: 0,
    converted: 0,
    timeframe: '7d',
  };
}

export function emptyCrmConfig() {
  return {
    columns: [],
    statuses: [],
    sources: [],
    leadQualities: [],
    callStatuses: [],
  };
}
