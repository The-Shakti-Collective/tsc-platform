const Task = require('../domains/tasks/models/Task');
const { createTenantRepository } = require('./createTenantRepository');
const { getPrismaClient } = require('../infrastructure/postgres/prismaClient');
const { isPostgresTasksEnabled } = require('../infrastructure/postgres/prismaClient');
const {
  mirrorTaskFromMongo,
  deleteTaskMirror,
} = require('../infrastructure/postgres/postgresEntityWrites');
const {
  resolveTscId,
  resolveMongoId,
  resolveMongoUserId,
  resolvePersonId,
} = require('../infrastructure/postgres/syncMappingHelper');
const { mapTaskRow, TASK_STATUS_TO_LEGACY } = require('../infrastructure/postgres/postgresEntityMappers');
const { getTenantId } = require('../utils/tenantContext');
const { isObjectIdString, toObjectId } = require('../utils/mongoId');
const projectRepository = require('./projectRepository');

const mongoRepo = createTenantRepository(Task);

const PRISMA_STATUS_FROM_LEGACY = {
  todo: 'todo',
  'in-progress': 'in_progress',
  'in-review': 'in_progress',
  done: 'done',
  blocked: 'blocked',
};

async function resolveTaskMongoId(id) {
  if (!id) return null;
  const str = String(id);
  if (isObjectIdString(str)) return str;
  return resolveMongoId('Task', str);
}

async function resolveTaskTscId(id) {
  if (!id) return null;
  const str = String(id);
  const byMapping = await resolveTscId('Task', str);
  if (byMapping) return byMapping;
  if (!isObjectIdString(str)) return str;
  return null;
}

async function hydrateTask(row, tenantId) {
  const prisma = await getPrismaClient();
  const mongoId = await resolveMongoId('Task', row.id);
  const workspace = await prisma.workspace.findUnique({
    where: { id: row.workspaceId },
    select: { name: true },
  });
  const assignees = await prisma.taskAssignee.findMany({
    where: { taskId: row.id },
    select: { personId: true },
  });
  const assigneeMongoIds = await Promise.all(
    assignees.map((a) => resolveMongoUserId(a.personId)),
  );
  const createdByMongoId = await resolveMongoUserId(row.createdByPersonId);
  const projectMongoId = row.projectId
    ? await resolveMongoId('Project', row.projectId)
    : null;

  return mapTaskRow(row, {
    mongoId: mongoId || row.id,
    tenantId,
    assigneeMongoIds: assigneeMongoIds.filter(Boolean),
    createdByMongoId,
    projectMongoId,
    workspaceLabel: workspace?.name,
  });
}

function buildPrismaTaskWhere(filter = {}) {
  const where = {};

  if (filter._id || filter.id) {
    return { id: filter._id || filter.id };
  }

  if (filter.projectId) {
    const pid = filter.projectId;
    if (filter.projectId.$in) {
      where.projectId = { in: filter.projectId.$in.map(String) };
    } else {
      where.projectId = String(pid);
    }
  }

  if (filter.status) {
    if (filter.status.$ne) {
      const legacy = String(filter.status.$ne);
      const prismaStatus = PRISMA_STATUS_FROM_LEGACY[legacy] || legacy;
      where.NOT = { status: prismaStatus };
    } else if (filter.status.$in) {
      where.status = {
        in: filter.status.$in.map((s) => PRISMA_STATUS_FROM_LEGACY[s] || s),
      };
    } else {
      where.status = PRISMA_STATUS_FROM_LEGACY[filter.status] || filter.status;
    }
  }

  if (filter.workspace) {
    // workspace label resolved in findPostgresTasks via workspaceId lookup
  }

  return where;
}

async function resolveProjectIdsForFilter(filter) {
  if (!filter.projectId) return filter;
  const next = { ...filter };
  if (filter.projectId.$in) {
    const ids = await Promise.all(
      filter.projectId.$in.map((id) => projectRepository.resolveProjectTscId(id)),
    );
    next.projectId = { $in: ids.filter(Boolean) };
    return next;
  }
  const tscId = await projectRepository.resolveProjectTscId(filter.projectId);
  if (tscId) next.projectId = tscId;
  return next;
}

async function findPostgresTasks(filter = {}, options = {}) {
  const prisma = await getPrismaClient();
  const tenantId = options.tenantId || getTenantId();
  const resolvedFilter = await resolveProjectIdsForFilter(filter);
  const where = buildPrismaTaskWhere(resolvedFilter);

  if (resolvedFilter._id || resolvedFilter.id) {
    const tscId = await resolveTaskTscId(resolvedFilter._id || resolvedFilter.id);
    if (!tscId) return [];
    where.id = tscId;
  }

  if (resolvedFilter.projectId && !resolvedFilter.projectId.$in) {
    const tscId = await projectRepository.resolveProjectTscId(resolvedFilter.projectId);
    if (tscId) where.projectId = tscId;
    else if (!isObjectIdString(String(resolvedFilter.projectId))) where.projectId = resolvedFilter.projectId;
    else return [];
  }

  if (resolvedFilter.projectId?.$in) {
    const tscIds = [];
    for (const pid of resolvedFilter.projectId.$in) {
      const tscId = await projectRepository.resolveProjectTscId(pid);
      if (tscId) tscIds.push(tscId);
      else if (!isObjectIdString(String(pid))) tscIds.push(String(pid));
    }
    if (!tscIds.length) return [];
    where.projectId = { in: tscIds };
  }

  const rows = await prisma.task.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: options.limit,
    skip: options.skip,
  });

  return Promise.all(rows.map((row) => hydrateTask(row, tenantId)));
}

async function countPostgresTasks(filter = {}, options = {}) {
  const prisma = await getPrismaClient();
  const resolvedFilter = await resolveProjectIdsForFilter(filter);
  const where = buildPrismaTaskWhere(resolvedFilter);

  if (resolvedFilter.projectId && !resolvedFilter.projectId.$in) {
    const tscId = await projectRepository.resolveProjectTscId(resolvedFilter.projectId);
    if (tscId) where.projectId = tscId;
    else if (!isObjectIdString(String(resolvedFilter.projectId))) where.projectId = resolvedFilter.projectId;
    else return 0;
  }

  if (resolvedFilter.projectId?.$in) {
    const tscIds = [];
    for (const pid of resolvedFilter.projectId.$in) {
      const tscId = await projectRepository.resolveProjectTscId(pid);
      if (tscId) tscIds.push(tscId);
      else if (!isObjectIdString(String(pid))) tscIds.push(String(pid));
    }
    if (!tscIds.length) return 0;
    where.projectId = { in: tscIds };
  }

  return prisma.task.count({ where });
}

async function aggregatePostgresTaskCounts(pipeline) {
  const matchStage = pipeline.find((s) => s.$match);
  const groupStage = pipeline.find((s) => s.$group);
  if (!matchStage || !groupStage) return [];

  const filter = { ...matchStage.$match };
  if (filter.projectId?.$in) {
    const tscIds = [];
    for (const pid of filter.projectId.$in) {
      const tscId = await projectRepository.resolveProjectTscId(pid);
      if (tscId) tscIds.push(tscId);
      else if (!isObjectIdString(String(pid))) tscIds.push(String(pid));
    }
    filter.projectId = { $in: tscIds };
  }

  const tasks = await findPostgresTasks(filter);
  const byProject = new Map();

  for (const task of tasks) {
    const pid = task.projectId ? String(task.projectId) : null;
    if (!pid) continue;
    const bucket = byProject.get(pid) || { total: 0, completed: 0 };
    bucket.total += 1;
    if (task.status === 'done') bucket.completed += 1;
    byProject.set(pid, bucket);
  }

  return [...byProject.entries()].map(([projectId, counts]) => ({
    _id: isObjectIdString(projectId) ? toObjectId(projectId) : projectId,
    total: counts.total,
    completed: counts.completed,
  }));
}

function usePostgres(options = {}) {
  return isPostgresTasksEnabled() && !options.bypass;
}

function chainableQuery(rowsOrPromise) {
  let sortSpec = null;
  let limitVal;
  let skipVal;
  const promise = () => Promise.resolve(rowsOrPromise).then((rows) => {
    let list = Array.isArray(rows) ? [...rows] : (rows ? [rows] : []);
    if (sortSpec) {
      const [[field, dir]] = Object.entries(sortSpec);
      list.sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (dir === -1 ? -1 : 1);
      });
    }
    if (skipVal) list = list.slice(skipVal);
    if (limitVal) list = list.slice(0, limitVal);
    return Array.isArray(rows) ? list : (list[0] || null);
  });

  const chain = {
    lean: () => promise(),
    select: () => chain,
    populate: () => chain,
    sort: (spec) => { sortSpec = spec; return chain; },
    skip: (n) => { skipVal = n; return chain; },
    limit: (n) => { limitVal = n; return chain; },
    session: () => chain,
  };
  return chain;
}

const taskRepository = {
  find(filter = {}, options = {}) {
    if (!usePostgres(options)) return mongoRepo.find(filter, options);
    return chainableQuery(findPostgresTasks(filter, options));
  },

  findOne(filter = {}, options = {}) {
    if (!usePostgres(options)) return mongoRepo.findOne(filter, options);
    return chainableQuery(findPostgresTasks(filter, { ...options, limit: 1 }).then((r) => r[0] || null));
  },

  findById(id, options = {}) {
    return this.findOne({ _id: id }, options);
  },

  countDocuments(filter = {}, options = {}) {
    if (!usePostgres(options)) return mongoRepo.countDocuments(filter, options);
    return countPostgresTasks(filter, options);
  },

  async aggregate(pipeline, options = {}) {
    if (!usePostgres(options)) return mongoRepo.aggregate(pipeline, options);
    return aggregatePostgresTaskCounts(pipeline);
  },

  async create(doc) {
    const created = await mongoRepo.create(doc);
    if (isPostgresTasksEnabled()) {
      await mirrorTaskFromMongo(created);
    }
    return created;
  },

  async findOneAndUpdate(filter, update, options = {}) {
    const updated = await mongoRepo.findOneAndUpdate(filter, update, options);
    if (updated && isPostgresTasksEnabled()) {
      await mirrorTaskFromMongo(updated);
    }
    return updated;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const updated = await mongoRepo.findByIdAndUpdate(id, update, options);
    if (updated && isPostgresTasksEnabled()) {
      await mirrorTaskFromMongo(updated);
    }
    return updated;
  },

  async deleteOne(filter, options = {}) {
    const doc = await mongoRepo.findOne(filter, options);
    if (!doc) return null;
    const result = await mongoRepo.deleteOne(filter, options);
    if (isPostgresTasksEnabled()) {
      await deleteTaskMirror(doc._id);
    }
    return result;
  },

  isPostgresTasksEnabled,
  resolveTaskMongoId,
  resolveTaskTscId,
  resolvePersonId,
};

module.exports = taskRepository;
