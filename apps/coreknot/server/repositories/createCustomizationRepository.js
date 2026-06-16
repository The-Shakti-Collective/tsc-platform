const {
  getPrismaClient,
  isPostgresStoreEnabled,
  isMongoRequired,
  isPostgresConfigured,
} = require('../infrastructure/postgres/prismaClient');
const { canUseMongoModels } = require('../services/mongoConnectionService');
const { getTenantId } = require('../utils/tenantContext');
const {
  shouldWritePostgresFirst,
  shouldMirrorMongo,
} = require('../infrastructure/postgres/writeStrategy');

function isDuplicateKeyError(error) {
  return error?.code === 11000 || error?.code === 'P2002';
}

function applyMongoUpdate(existing, update = {}) {
  const base = { ...(existing?.toObject?.() || existing || {}) };
  const merged = { ...base };

  if (update.$set && typeof update.$set === 'object') {
    Object.assign(merged, update.$set);
  }
  if (update.$unset && typeof update.$unset === 'object') {
    for (const key of Object.keys(update.$unset)) {
      delete merged[key];
    }
  }

  for (const [key, value] of Object.entries(update)) {
    if (key.startsWith('$')) continue;
    merged[key] = value;
  }

  delete merged._id;
  delete merged.toObject;
  delete merged.save;
  return merged;
}

/**
 * User-scoped customization repo — Postgres via ck_legacy_documents (mongoId = userId).
 * Mongo model lazy-loaded only when COREKNOT_MONGO_REQUIRED !== false.
 */
function createCustomizationRepository({ modelPath, entityType, flagName }) {
  /** @type {import('mongoose').Model | null} */
  let MongoModel = null;

  function getMongoModel() {
    if (!MongoModel) {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      MongoModel = require(modelPath);
    }
    return MongoModel;
  }

  const isPostgresEnabled = () => isPostgresStoreEnabled(flagName);

  function shouldUsePostgresWrites() {
    return shouldWritePostgresFirst(isPostgresEnabled)
      || (isPostgresEnabled() && !shouldMirrorMongo());
  }

  function usePostgres(options = {}) {
    if (options.bypass) return false;
    if (isPostgresEnabled()) return true;
    // Mongo sunset: customization lives in ck_legacy_documents when Neon is primary.
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

  function userMongoId(userId) {
    return String(userId);
  }

  function toMongoShape(row) {
    const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
    const id = row.mongoId || payload.userId;
    const doc = {
      ...payload,
      _id: id,
      id,
      userId: payload.userId || id,
      tenantId: row.tenantId ?? payload.tenantId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? payload.updatedAt,
      _readSource: 'postgres',
    };

    doc.toObject = function toObject() {
      const obj = { ...payload, _id: id, id, userId: payload.userId || id };
      delete obj.toObject;
      delete obj.save;
      return obj;
    };

    doc.save = async function save() {
      const plain = this.toObject();
      const saved = await writePostgres(plain.userId || id, plain);
      Object.assign(this, saved);
      return this;
    };

    return doc;
  }

  async function readPostgresByUserId(userId) {
    const prisma = await getPrismaClient();
    const mongoId = userMongoId(userId);
    const tenantId = getTenantId();

    const row = await prisma.ckLegacyDocument.findUnique({
      where: { entityType_mongoId: { entityType, mongoId } },
    });

    if (!row) return null;
    if (tenantId && row.tenantId && String(row.tenantId) !== String(tenantId)) {
      return null;
    }
    return toMongoShape(row);
  }

  async function writePostgres(userId, payload) {
    const prisma = await getPrismaClient();
    const mongoId = userMongoId(userId);
    const tenantId = getTenantId() || payload.tenantId?.toString?.() || payload.tenantId || null;
    const now = new Date();
    const plain = { ...payload, userId: String(userId), updatedAt: payload.updatedAt || now };

    delete plain._id;
    delete plain.toObject;
    delete plain.save;

    const row = await prisma.ckLegacyDocument.upsert({
      where: { entityType_mongoId: { entityType, mongoId } },
      create: {
        entityType,
        mongoId,
        tenantId,
        payload: plain,
      },
      update: {
        tenantId,
        payload: plain,
      },
    });

    return toMongoShape(row);
  }

  async function mirrorToMongo(userId, payload) {
    if (!shouldMirrorMongo()) return null;
    assertMongoAvailable();
    const Model = getMongoModel();
    const filter = { userId };
    const existing = await Model.findOne(filter);
    if (existing) {
      Object.assign(existing, payload);
      existing.updatedAt = payload.updatedAt || new Date();
      return existing.save();
    }
    return Model.create({ userId, ...payload });
  }

  async function writePrimary(userId, payload) {
    const saved = await writePostgres(userId, payload);
    await mirrorToMongo(userId, saved.toObject());
    return saved;
  }

  function chainableQuery(rowsOrPromise) {
    const promise = () => Promise.resolve(rowsOrPromise).then((rows) => rows);
    const chain = {
      lean: () => promise(),
      select: () => chain,
      populate: () => chain,
      sort: () => chain,
      skip: () => chain,
      limit: () => chain,
      session: () => chain,
      then: (resolve, reject) => promise().then(resolve, reject),
    };
    return chain;
  }

  return {
    entityType,
    flagName,
    isPostgresEnabled,

    findOne(filter = {}, options = {}) {
      if (!usePostgres(options)) {
        assertMongoAvailable();
        const Model = getMongoModel();
        return Model.findOne(filter);
      }
      if (!filter.userId) {
        return chainableQuery(Promise.resolve(null));
      }
      return chainableQuery(readPostgresByUserId(filter.userId));
    },

    async create(doc) {
      const userId = doc.userId;
      if (shouldUsePostgresWrites() || usePostgres()) {
        try {
          return await writePrimary(userId, doc);
        } catch (error) {
          if (!isDuplicateKeyError(error)) throw error;
          const existing = await readPostgresByUserId(userId);
          if (!existing) throw error;
          return existing;
        }
      }

      assertMongoAvailable();
      const Model = getMongoModel();
      const created = await Model.create(doc);
      if (isPostgresEnabled()) {
        await writePostgres(userId, created.toObject ? created.toObject() : created);
      }
      return created;
    },

    async findOneAndUpdate(filter, update, options = {}) {
      const userId = filter.userId;
      if (!userId) return null;

      if (shouldUsePostgresWrites() || usePostgres()) {
        let existing = await readPostgresByUserId(userId);
        if (!existing && options.upsert) {
          const initial = applyMongoUpdate({}, update);
          return writePrimary(userId, initial);
        }
        if (!existing) return null;

        const merged = applyMongoUpdate(existing, update);
        merged.updatedAt = merged.updatedAt || new Date();
        return writePrimary(userId, merged);
      }

      assertMongoAvailable();
      const Model = getMongoModel();
      return Model.findOneAndUpdate(filter, update, options);
    },

    async deleteOne(filter, options = {}) {
      const userId = filter.userId;
      if (!userId) return { deletedCount: 0 };

      if (shouldUsePostgresWrites()) {
        const prisma = await getPrismaClient();
        const result = await prisma.ckLegacyDocument.deleteMany({
          where: { entityType, mongoId: userMongoId(userId) },
        });
        if (shouldMirrorMongo()) {
          assertMongoAvailable();
          const Model = getMongoModel();
          await Model.deleteOne(filter);
        }
        return { deletedCount: result.count };
      }

      assertMongoAvailable();
      const Model = getMongoModel();
      const result = await Model.deleteOne(filter);
      if (isPostgresEnabled()) {
        const prisma = await getPrismaClient();
        await prisma.ckLegacyDocument.deleteMany({
          where: { entityType, mongoId: userMongoId(userId) },
        });
      }
      return result;
    },
  };
}

module.exports = { createCustomizationRepository, isDuplicateKeyError };
