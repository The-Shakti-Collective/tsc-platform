const Task = require('../domains/tasks/models/Task');
const { createTenantRepository } = require('./createTenantRepository');
const { getPrismaClient } = require('../infrastructure/postgres/prismaClient');
const { isPostgresTasksEnabled } = require('../infrastructure/postgres/prismaClient');
const {
  mirrorTaskFromMongo,
  deleteTaskMirror,
  upsertTaskFromMongo,
  deleteTaskMirrorSync,
} = require('../infrastructure/postgres/postgresEntityWrites');
const {
  shouldWritePostgresFirst,
  shouldMirrorMongo,
  asMongoDoc,
} = require('../infrastructure/postgres/writeStrategy');
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

function legacyStatusesToPrisma(statuses = []) {
  return [...new Set(statuses.map((s) => PRISMA_STATUS_FROM_LEGACY[s] || s))];
}

function needsPostgresTaskFilter(filter = {}) {
  return Boolean(
    filter.$expr
    || filter.$or
    || filter.$and
    || filter.createdBy
    || filter.mentionAccessIds
    || filter._id?.$in,
  );
}

function matchDashboardTaskExpr(task, expr) {
  if (!expr?.$let) return true;
  const { vars, in: inExpr } = expr.$let;
  const ifNullFields = vars?.taskDay?.$ifNull;
  if (!Array.isArray(ifNullFields)) return true;

  const fieldNames = ifNullFields.map((f) => String(f).replace(/^\$/, ''));
  const taskDay = fieldNames.reduce(
    (val, field) => val ?? task[field],
    null,
  );

  const clauses = inExpr?.$and || [inExpr];
  for (const clause of clauses) {
    if (clause?.$ne) {
      const [, right] = clause.$ne;
      if (right == null && (taskDay == null || taskDay === '')) return false;
    }
    if (clause?.$lt) {
      const [, right] = clause.$lt;
      const limit = right instanceof Date ? right : new Date(right);
      if (taskDay == null || new Date(taskDay) >= limit) return false;
    }
  }
  return true;
}

function taskMatchesSubFilter(task, subFilter = {}) {
  if (subFilter.createdBy != null) {
    const createdBy = task.createdBy?._id || task.createdBy;
    if (String(createdBy) !== String(subFilter.createdBy)) return false;
  }
  if (subFilter._id?.$in) {
    const set = new Set(subFilter._id.$in.map((id) => String(id)));
    if (!set.has(String(task._id))) return false;
  }
  if (subFilter.mentionAccessIds != null) {
    const mid = String(subFilter.mentionAccessIds);
    const mentions = task.mentionAccessIds || [];
    if (!mentions.some((id) => String(id) === mid)) return false;
  }
  if (subFilter.status?.$ne) {
    if (task.status === subFilter.status.$ne) return false;
  }
  if (subFilter.status?.$nin) {
    if (subFilter.status.$nin.includes(task.status)) return false;
  }
  if (subFilter.$expr && !matchDashboardTaskExpr(task, subFilter.$expr)) return false;
  return true;
}

function applyPostgresTaskFilters(tasks, filter = {}) {
  let list = tasks;
  if (filter._id?.$in) {
    const set = new Set(filter._id.$in.map((id) => String(id)));
    list = list.filter((task) => set.has(String(task._id)));
  }
  if (filter.createdBy != null) {
    list = list.filter((task) => taskMatchesSubFilter(task, { createdBy: filter.createdBy }));
  }
  if (filter.mentionAccessIds != null) {
    list = list.filter((task) => taskMatchesSubFilter(task, { mentionAccessIds: filter.mentionAccessIds }));
  }
  if (filter.$expr) {
    list = list.filter((task) => matchDashboardTaskExpr(task, filter.$expr));
  }
  if (filter.$or) {
    list = list.filter((task) => filter.$or.some((clause) => taskMatchesSubFilter(task, clause)));
  }
  if (filter.$and) {
    list = list.filter((task) => filter.$and.every((clause) => taskMatchesSubFilter(task, clause)));
  }
  return list;
}

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
    } else if (filter.status.$nin) {
      where.status = { notIn: legacyStatusesToPrisma(filter.status.$nin) };
    } else if (filter.status.$in) {
      where.status = {
        in: legacyStatusesToPrisma(filter.status.$in),
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

  const postFilter = needsPostgresTaskFilter(resolvedFilter);
  const rows = await prisma.task.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    ...(postFilter ? {} : { take: options.limit, skip: options.skip }),
  });

  let tasks = await Promise.all(rows.map((row) => hydrateTask(row, tenantId)));
  if (postFilter) {
    tasks = applyPostgresTaskFilters(tasks, resolvedFilter);
    if (options.skip) tasks = tasks.slice(options.skip);
    if (options.limit) tasks = tasks.slice(0, options.limit);
  }
  return tasks;
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

  if (needsPostgresTaskFilter(resolvedFilter)) {
    const tasks = await findPostgresTasks(resolvedFilter, { ...options, limit: undefined, skip: undefined });
    return tasks.length;
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
    if (shouldWritePostgresFirst(isPostgresTasksEnabled)) {
      const created = shouldMirrorMongo() ? await mongoRepo.create(doc) : asMongoDoc(doc);
      await upsertTaskFromMongo(created);
      return created;
    }
    const created = await mongoRepo.create(doc);
    if (isPostgresTasksEnabled()) {
      await upsertTaskFromMongo(created);
    }
    return created;
  },

  async findOneAndUpdate(filter, update, options = {}) {
    if (shouldWritePostgresFirst(isPostgresTasksEnabled)) {
      let updated;
      if (shouldMirrorMongo()) {
        updated = await mongoRepo.findOneAndUpdate(filter, update, options);
      } else {
        const existing = await this.findOne(filter, options);
        if (!existing) return null;
        updated = { ...existing, ...(update.$set || update) };
      }
      if (updated) await upsertTaskFromMongo(asMongoDoc(updated));
      return updated;
    }
    const updated = await mongoRepo.findOneAndUpdate(filter, update, options);
    if (updated && isPostgresTasksEnabled()) {
      await upsertTaskFromMongo(updated);
    }
    return updated;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  },

  async deleteOne(filter, options = {}) {
    const doc = await mongoRepo.findOne(filter, options);
    if (!doc && !usePostgres(options)) return null;
    const target = doc || await this.findOne(filter, options);
    if (!target) return null;
    if (shouldWritePostgresFirst(isPostgresTasksEnabled)) {
      await deleteTaskMirrorSync(target._id);
      if (shouldMirrorMongo()) {
        return mongoRepo.deleteOne(filter, options);
      }
      return { deletedCount: 1 };
    }
    const result = await mongoRepo.deleteOne(filter, options);
    if (isPostgresTasksEnabled()) {
      await deleteTaskMirrorSync(doc._id);
    }
    return result;
  },

  isPostgresTasksEnabled,
  resolveTaskMongoId,
  resolveTaskTscId,
  resolvePersonId,
  buildPrismaTaskWhere,
  matchDashboardTaskExpr,
  applyPostgresTaskFilters,
  legacyStatusesToPrisma,
};

module.exports = taskRepository;
