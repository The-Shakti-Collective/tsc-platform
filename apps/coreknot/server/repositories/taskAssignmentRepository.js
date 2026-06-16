const { canUseMongoModels } = require('../services/mongoConnectionService');
const {
  getPrismaClient,
  isPostgresTasksEnabled,
  isPostgresConfigured,
  isMongoRequired,
} = require('../infrastructure/postgres/prismaClient');
const { resolvePersonId, resolveMongoId } = require('../infrastructure/postgres/syncMappingHelper');
const { resolveTaskTscId } = require('./taskRepository');

/** @type {import('mongoose').Model | null} */
let MongoModel = null;

function getMongoModel() {
  if (!MongoModel) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    MongoModel = require('../models/TaskAssignment');
  }
  return MongoModel;
}

function usePostgres(options = {}) {
  if (options.bypass) return false;
  if (isPostgresTasksEnabled()) return true;
  if (!isMongoRequired() && isPostgresConfigured()) return true;
  return false;
}

function assertMongoAvailable() {
  if (canUseMongoModels()) return;
  const err = new Error('Database temporarily unavailable.');
  err.name = 'MongooseError';
  err.message = 'Cannot call Mongo models before initial connection is complete if `bufferCommands = false`.';
  throw err;
}

function chainableQuery(rowsOrPromise) {
  const promise = () => Promise.resolve(rowsOrPromise).then((rows) => rows);
  const chain = {
    select: () => chain,
    lean: () => promise(),
    session: () => chain,
    then: (resolve, reject) => promise().then(resolve, reject),
  };
  return chain;
}

async function mapAssigneeRow(row, userIdOverride) {
  const taskMongoId = await resolveMongoId('Task', row.taskId);
  const userMongoId = userIdOverride || await resolveMongoId('Person', row.personId);
  if (!taskMongoId || !userMongoId) return null;
  return {
    taskId: taskMongoId,
    userId: userMongoId,
    assignedAt: row.assignedAt,
  };
}

async function findPostgresAssignments(filter = {}) {
  const prisma = await getPrismaClient();
  const where = {};

  if (filter.userId) {
    const personId = await resolvePersonId(String(filter.userId));
    if (!personId) return [];
    where.personId = personId;
  }

  if (filter.taskId) {
    const tscId = await resolveTaskTscId(filter.taskId);
    if (!tscId) return [];
    where.taskId = tscId;
  }

  if (filter.taskId?.$in) {
    const tscIds = [];
    for (const id of filter.taskId.$in) {
      const tscId = await resolveTaskTscId(id);
      if (tscId) tscIds.push(tscId);
    }
    if (!tscIds.length) return [];
    where.taskId = { in: tscIds };
  }

  const rows = await prisma.taskAssignee.findMany({ where });
  const mapped = await Promise.all(
    rows.map((row) => mapAssigneeRow(row, filter.userId ? String(filter.userId) : null)),
  );
  return mapped.filter(Boolean);
}

async function distinctTaskIdsForUser(userId) {
  const rows = await findPostgresAssignments({ userId });
  return [...new Set(rows.map((r) => r.taskId).filter(Boolean))];
}

const taskAssignmentRepository = {
  usePostgres,
  isPostgresTasksEnabled,

  find(filter = {}, options = {}) {
    if (!usePostgres(options)) {
      assertMongoAvailable();
      return getMongoModel().find(filter);
    }
    return chainableQuery(findPostgresAssignments(filter));
  },

  findOne(filter = {}, options = {}) {
    if (!usePostgres(options)) {
      assertMongoAvailable();
      return getMongoModel().findOne(filter);
    }
    return chainableQuery(
      findPostgresAssignments(filter).then((rows) => rows[0] || null),
    );
  },

  async distinct(field, filter = {}, options = {}) {
    if (field !== 'taskId') {
      throw new Error(`taskAssignmentRepository.distinct: unsupported field ${field}`);
    }
    if (!usePostgres(options)) {
      assertMongoAvailable();
      return getMongoModel().distinct(field, filter);
    }
    if (!filter.userId) return [];
    return distinctTaskIdsForUser(filter.userId);
  },

  async deleteMany(filter = {}, options = {}) {
    if (!usePostgres(options)) {
      assertMongoAvailable();
      return getMongoModel().deleteMany(filter, options);
    }
    const prisma = await getPrismaClient();
    const where = {};
    if (filter.taskId) {
      const tscId = await resolveTaskTscId(filter.taskId);
      if (!tscId) return { deletedCount: 0 };
      where.taskId = tscId;
    }
    if (filter.userId) {
      const personId = await resolvePersonId(String(filter.userId));
      if (!personId) return { deletedCount: 0 };
      where.personId = personId;
    }
    const result = await prisma.taskAssignee.deleteMany({ where });
    return { deletedCount: result.count };
  },

  async insertMany(docs = [], options = {}) {
    if (!usePostgres(options)) {
      assertMongoAvailable();
      return getMongoModel().insertMany(docs, options);
    }
    const prisma = await getPrismaClient();
    const created = [];
    for (const doc of docs) {
      const tscTaskId = await resolveTaskTscId(doc.taskId);
      const personId = await resolvePersonId(String(doc.userId));
      if (!tscTaskId || !personId) continue;
      await prisma.taskAssignee.upsert({
        where: { taskId_personId: { taskId: tscTaskId, personId } },
        create: {
          taskId: tscTaskId,
          personId,
          assignedAt: doc.assignedAt || new Date(),
        },
        update: { assignedAt: doc.assignedAt || new Date() },
      });
      created.push(doc);
    }
    return created;
  },

  async create(docs, options = {}) {
    const list = Array.isArray(docs) ? docs : [docs];
    return this.insertMany(list, options);
  },

  distinctTaskIdsForUser,
};

module.exports = taskAssignmentRepository;
