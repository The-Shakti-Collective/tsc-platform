const { canUseMongoModels } = require('../services/mongoConnectionService');
const {
  getPrismaClient,
  isPostgresTasksEnabled,
  isPostgresConfigured,
  isMongoRequired,
} = require('../infrastructure/postgres/prismaClient');
const { getTenantId } = require('../utils/tenantContext');

const ENTITY_TYPE = 'TaskMentionReceipt';

/** @type {import('mongoose').Model | null} */
let MongoModel = null;

function getMongoModel() {
  if (!MongoModel) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    MongoModel = require('../domains/tasks/models/TaskMentionReceipt');
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

function compositeMongoId(userId, taskId) {
  return `${String(userId)}:${String(taskId)}`;
}

function applyMongoUpdate(existing, update = {}) {
  const merged = { ...(existing || {}) };
  if (update.$set && typeof update.$set === 'object') {
    Object.assign(merged, update.$set);
  }
  if (update.$inc?.unreadCount) {
    merged.unreadCount = (merged.unreadCount || 0) + update.$inc.unreadCount;
  }
  for (const [key, value] of Object.entries(update)) {
    if (key.startsWith('$')) continue;
    merged[key] = value;
  }
  return merged;
}

function toMongoShape(row) {
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  return {
    ...payload,
    _id: row.mongoId,
    userId: payload.userId,
    taskId: payload.taskId,
    unreadCount: payload.unreadCount ?? 0,
    lastMentionAt: payload.lastMentionAt,
    tenantId: row.tenantId ?? payload.tenantId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? payload.updatedAt,
  };
}

async function readPostgresReceipt(userId, taskId) {
  const prisma = await getPrismaClient();
  const mongoId = compositeMongoId(userId, taskId);
  const tenantId = getTenantId();
  const row = await prisma.ckLegacyDocument.findUnique({
    where: { entityType_mongoId: { entityType: ENTITY_TYPE, mongoId } },
  });
  if (!row) return null;
  if (tenantId && row.tenantId && String(row.tenantId) !== String(tenantId)) return null;
  return toMongoShape(row);
}

async function writePostgresReceipt(userId, taskId, payload) {
  const prisma = await getPrismaClient();
  const mongoId = compositeMongoId(userId, taskId);
  const tenantId = getTenantId() || payload.tenantId?.toString?.() || payload.tenantId || null;
  const now = new Date();
  const plain = {
    ...payload,
    userId: String(userId),
    taskId: String(taskId),
    updatedAt: payload.updatedAt || now,
  };

  const row = await prisma.ckLegacyDocument.upsert({
    where: { entityType_mongoId: { entityType: ENTITY_TYPE, mongoId } },
    create: { entityType: ENTITY_TYPE, mongoId, tenantId, payload: plain },
    update: { tenantId, payload: plain },
  });
  return toMongoShape(row);
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

const taskMentionReceiptRepository = {
  usePostgres,

  find(filter = {}, options = {}) {
    if (!usePostgres(options)) {
      assertMongoAvailable();
      return getMongoModel().find(filter);
    }
    return chainableQuery((async () => {
      if (!filter.userId) return [];
      const taskIds = filter.taskId?.$in || (filter.taskId ? [filter.taskId] : []);
      if (!taskIds.length) return [];
      const unreadGt = filter.unreadCount?.$gt ?? 0;
      const rows = await Promise.all(
        taskIds.map((taskId) => readPostgresReceipt(filter.userId, taskId)),
      );
      return rows
        .filter(Boolean)
        .filter((row) => (row.unreadCount || 0) > unreadGt);
    })());
  },

  async findOneAndUpdate(filter, update, options = {}) {
    const userId = filter.userId;
    const taskId = filter.taskId;
    if (!userId || !taskId) return null;

    if (!usePostgres(options)) {
      assertMongoAvailable();
      return getMongoModel().findOneAndUpdate(filter, update, options);
    }

    let existing = await readPostgresReceipt(userId, taskId);
    if (!existing && options.upsert) {
      const initial = applyMongoUpdate(
        { userId: String(userId), taskId: String(taskId), unreadCount: 0 },
        update,
      );
      return writePostgresReceipt(userId, taskId, initial);
    }
    if (!existing) return null;

    const merged = applyMongoUpdate(existing, update);
    merged.updatedAt = merged.updatedAt || new Date();
    return writePostgresReceipt(userId, taskId, merged);
  },

  async deleteMany(filter = {}, options = {}) {
    if (!usePostgres(options)) {
      assertMongoAvailable();
      return getMongoModel().deleteMany(filter, options);
    }
    const prisma = await getPrismaClient();

    if (filter.userId && filter.taskId) {
      const result = await prisma.ckLegacyDocument.deleteMany({
        where: {
          entityType: ENTITY_TYPE,
          mongoId: compositeMongoId(filter.userId, filter.taskId),
        },
      });
      return { deletedCount: result.count };
    }

    const taskIds = filter.taskId?.$in || (filter.taskId ? [filter.taskId] : []);
    if (!taskIds.length) return { deletedCount: 0 };

    const idSet = new Set(taskIds.map(String));
    const rows = await prisma.ckLegacyDocument.findMany({
      where: { entityType: ENTITY_TYPE },
      select: { mongoId: true, payload: true },
    });
    const toDelete = rows
      .filter((row) => idSet.has(String(row.payload?.taskId)))
      .map((row) => row.mongoId);
    if (!toDelete.length) return { deletedCount: 0 };

    const result = await prisma.ckLegacyDocument.deleteMany({
      where: { entityType: ENTITY_TYPE, mongoId: { in: toDelete } },
    });
    return { deletedCount: result.count };
  },

  async countDocuments(filter = {}, options = {}) {
    const rows = await this.find(filter, options).lean();
    return Array.isArray(rows) ? rows.length : 0;
  },
};

module.exports = taskMentionReceiptRepository;
