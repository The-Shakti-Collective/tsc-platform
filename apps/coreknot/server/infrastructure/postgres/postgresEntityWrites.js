const { getPrismaClient } = require('./prismaClient');
const {
  upsertSyncMapping,
  resolveWorkspaceIdForLabel,
  slugify,
  mirrorPostgres,
} = require('./dualWriteHelper');
const { resolveTscId, resolvePersonId } = require('./syncMappingHelper');

const PRISMA_TASK_STATUS = {
  todo: 'todo',
  'in-progress': 'in_progress',
  'in-review': 'in_progress',
  done: 'done',
  blocked: 'blocked',
};

const PRISMA_TASK_PRIORITY = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'urgent',
};

const PRISMA_PROJECT_STATUS = {
  active: 'active',
  completed: 'completed',
  archived: 'archived',
};

const STAGE_FROM_LEAD_STATUS = {
  New: 'new',
  Contacted: 'contacted',
  Warm: 'qualified',
  Proposal: 'proposal',
  Converted: 'won',
  Lost: 'lost',
};

async function mirrorProjectFromMongo(mongoDoc) {
  const prisma = await getPrismaClient();
  const mongoId = mongoDoc._id.toString();
  const workspaceLabel = mongoDoc.workspace || 'GENERAL';
  const workspaceId = await resolveWorkspaceIdForLabel(prisma, workspaceLabel);
  if (!workspaceId) return;

  const existingTscId = await resolveTscId('Project', mongoId);
  const ownerPersonId = mongoDoc.owner
    ? await resolvePersonId(String(mongoDoc.owner))
    : null;

  const data = {
    workspaceId,
    slug: slugify(mongoDoc.name, `project-${mongoId.slice(-6)}`),
    name: mongoDoc.name,
    type: 'general',
    description: mongoDoc.description ?? undefined,
    status: PRISMA_PROJECT_STATUS[mongoDoc.status] || 'active',
    metadata: {
      outletId: mongoDoc.outletId,
      tags: mongoDoc.tags ?? [],
      progress: mongoDoc.progress ?? 0,
      totalTasksCount: mongoDoc.totalTasksCount ?? 0,
      completedTasksCount: mongoDoc.completedTasksCount ?? 0,
      linkedCalendars: mongoDoc.linkedCalendars ?? [],
      color: mongoDoc.color,
      starred: mongoDoc.starred ?? false,
      legacyWorkspaceLabel: workspaceLabel,
      memberRoles: mongoDoc.memberRoles ?? [],
    },
  };

  let projectId = existingTscId;
  if (projectId) {
    await prisma.project.update({ where: { id: projectId }, data });
  } else {
    const row = await prisma.project.create({ data });
    projectId = row.id;
    await upsertSyncMapping(mongoId, 'Project', projectId, { workspaceId });
  }

  if (ownerPersonId || (mongoDoc.members || []).length) {
    const memberIds = new Set((mongoDoc.members || []).map(String));
    if (mongoDoc.owner) memberIds.add(String(mongoDoc.owner));
    for (const uid of memberIds) {
      const personId = await resolvePersonId(uid);
      if (!personId) continue;
      const role = String(mongoDoc.owner) === uid ? 'owner' : 'member';
      await prisma.projectMember.upsert({
        where: { projectId_personId: { projectId, personId } },
        create: { projectId, personId, role },
        update: { role },
      });
    }
  }
}

async function mirrorTaskFromMongo(mongoDoc) {
  const prisma = await getPrismaClient();
  const mongoId = mongoDoc._id.toString();
  const workspaceLabel = mongoDoc.workspace || 'GENERAL';
  const workspaceId = await resolveWorkspaceIdForLabel(prisma, workspaceLabel);
  if (!workspaceId) return;

  const projectId = mongoDoc.projectId
    ? await resolveTscId('Project', String(mongoDoc.projectId))
    : null;
  const createdByPersonId = mongoDoc.createdBy
    ? await resolvePersonId(String(mongoDoc.createdBy))
    : null;
  if (!createdByPersonId) return;

  const existingTscId = await resolveTscId('Task', mongoId);
  const data = {
    workspaceId,
    projectId: projectId ?? undefined,
    title: mongoDoc.title,
    description: mongoDoc.description ?? undefined,
    status: PRISMA_TASK_STATUS[mongoDoc.status] || 'todo',
    priority: PRISMA_TASK_PRIORITY[mongoDoc.priority] || 'medium',
    dueAt: mongoDoc.dueDate ?? undefined,
    createdByPersonId,
    metadata: {
      legacyStatus: mongoDoc.status,
      taskType: mongoDoc.type,
      scheduleSlot: mongoDoc.scheduleSlot,
      scheduleDate: mongoDoc.scheduleDate,
      legacyWorkspaceLabel: workspaceLabel,
      phaseId: mongoDoc.phaseId,
      parentTaskId: mongoDoc.parentTaskId,
      plannedHours: mongoDoc.plannedHours,
      actualHours: mongoDoc.actualHours,
      dependencies: mongoDoc.dependencies ?? [],
      projectId: mongoDoc.projectId ? String(mongoDoc.projectId) : undefined,
    },
  };

  let taskId = existingTscId;
  if (taskId) {
    await prisma.task.update({ where: { id: taskId }, data });
  } else {
    const row = await prisma.task.create({ data });
    taskId = row.id;
    await upsertSyncMapping(mongoId, 'Task', taskId, { workspaceId });
  }

  const assigneeIds = mongoDoc.assignees || mongoDoc.assigneeIds || [];
  for (const uid of assigneeIds) {
    const personId = await resolvePersonId(String(uid));
    if (!personId) continue;
    await prisma.taskAssignee.upsert({
      where: { taskId_personId: { taskId, personId } },
      create: { taskId, personId },
      update: {},
    });
  }
}

async function mirrorLeadFromMongo(mongoDoc) {
  const prisma = await getPrismaClient();
  const mongoId = mongoDoc._id.toString();
  const tenantId = mongoDoc.tenantId?.toString?.() || mongoDoc.tenantId;
  const organizationId = tenantId
    ? await resolveTscId('Organization', String(tenantId))
    : null;
  if (!organizationId) return;

  const assignedPersonId = mongoDoc.assignedRepId
    ? await resolvePersonId(String(mongoDoc.assignedRepId))
    : null;

  const existingTscId = await resolveTscId('Lead', mongoId);
  const stage = STAGE_FROM_LEAD_STATUS[mongoDoc.leadStatus] || 'new';
  const meta = mongoDoc.metadata && typeof mongoDoc.metadata === 'object'
    ? mongoDoc.metadata
    : {};

  const data = {
    organizationId,
    name: mongoDoc.name,
    email: mongoDoc.email ?? undefined,
    phone: mongoDoc.phone ?? undefined,
    source: mongoDoc.source ?? 'Organic / Direct',
    stage,
    assignedPersonId: assignedPersonId ?? undefined,
    notes: mongoDoc.remarks ?? undefined,
    metadata: {
      ...meta,
      crmType: mongoDoc.crmType ?? 'sales',
      legacyLeadStatus: mongoDoc.leadStatus,
      city: mongoDoc.city,
      leadQuality: mongoDoc.leadQuality,
      callStatus: mongoDoc.callStatus,
      meaningfulConnect: mongoDoc.meaningfulConnect,
      notes: mongoDoc.notes ?? [],
      emailStatus: mongoDoc.emailStatus,
      bounceCount: mongoDoc.bounceCount,
      unsubscribed: mongoDoc.unsubscribed,
    },
  };

  if (existingTscId) {
    await prisma.lead.update({ where: { id: existingTscId }, data });
  } else {
    const row = await prisma.lead.create({ data });
    await upsertSyncMapping(mongoId, 'Lead', row.id, { organizationId });
  }
}

async function mirrorArtistFromMongo(mongoDoc) {
  const prisma = await getPrismaClient();
  const mongoId = mongoDoc._id.toString();
  const existingTscId = await resolveTscId('Artist', mongoId);
  const meta = {
    tenantId: mongoDoc.tenantId?.toString?.() || mongoDoc.tenantId,
    teamUserIds: mongoDoc.team ?? [],
    website: mongoDoc.website,
    socials: mongoDoc.socials ?? {},
    legacyEvents: mongoDoc.events ?? [],
    discography: mongoDoc.discography ?? [],
  };

  const data = {
    name: mongoDoc.name,
    slug: mongoDoc.slug || slugify(mongoDoc.name, `artist-${mongoId.slice(-6)}`),
    bio: mongoDoc.bio ?? undefined,
    photoUrl: mongoDoc.profileImage ?? undefined,
    metadata: meta,
  };

  if (existingTscId) {
    await prisma.artist.update({ where: { id: existingTscId }, data });
  } else {
    const row = await prisma.artist.create({ data });
    await upsertSyncMapping(mongoId, 'Artist', row.id, {});
  }
}

async function deleteProjectMirror(mongoId) {
  const prisma = await getPrismaClient();
  const tscId = await resolveTscId('Project', String(mongoId));
  if (!tscId) return;
  await prisma.project.delete({ where: { id: tscId } }).catch(() => {});
  await prisma.syncMapping.deleteMany({
    where: { externalId: String(mongoId), tscEntityType: 'Project' },
  });
}

async function deleteTaskMirror(mongoId) {
  const prisma = await getPrismaClient();
  const tscId = await resolveTscId('Task', String(mongoId));
  if (!tscId) return;
  await prisma.task.delete({ where: { id: tscId } }).catch(() => {});
  await prisma.syncMapping.deleteMany({
    where: { externalId: String(mongoId), tscEntityType: 'Task' },
  });
}

async function deleteLeadMirror(mongoId) {
  const prisma = await getPrismaClient();
  const tscId = await resolveTscId('Lead', String(mongoId));
  if (!tscId) return;
  await prisma.lead.delete({ where: { id: tscId } }).catch(() => {});
  await prisma.syncMapping.deleteMany({
    where: { externalId: String(mongoId), tscEntityType: 'Lead' },
  });
}

module.exports = {
  mirrorProjectFromMongo: mirrorPostgres(mirrorProjectFromMongo, 'project'),
  mirrorTaskFromMongo: mirrorPostgres(mirrorTaskFromMongo, 'task'),
  mirrorLeadFromMongo: mirrorPostgres(mirrorLeadFromMongo, 'lead'),
  mirrorArtistFromMongo: mirrorPostgres(mirrorArtistFromMongo, 'artist'),
  upsertProjectFromMongo: mirrorProjectFromMongo,
  upsertTaskFromMongo: mirrorTaskFromMongo,
  upsertLeadFromMongo: mirrorLeadFromMongo,
  upsertArtistFromMongo: mirrorArtistFromMongo,
  deleteProjectMirror: mirrorPostgres(deleteProjectMirror, 'project-delete'),
  deleteTaskMirror: mirrorPostgres(deleteTaskMirror, 'task-delete'),
  deleteLeadMirror: mirrorPostgres(deleteLeadMirror, 'lead-delete'),
  deleteProjectMirrorSync: deleteProjectMirror,
  deleteTaskMirrorSync: deleteTaskMirror,
  deleteLeadMirrorSync: deleteLeadMirror,
};
