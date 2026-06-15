const { getPrismaClient, isPostgresStoreEnabled } = require('./prismaClient');
const { createTenantRepository } = require('./createTenantRepository');
const { getTenantId } = require('../utils/tenantContext');
const {
  shouldWritePostgresFirst,
  shouldMirrorMongo,
  asMongoDoc,
} = require('../infrastructure/postgres/writeStrategy');

/**
 * Factory for Wave 2 domains — mirrors Mongo docs into ck_legacy_documents when flag=postgres.
 * @param {object} opts
 * @param {import('mongoose').Model} opts.MongoModel
 * @param {string} opts.entityType SyncMapping / CkLegacyDocument entity key
 * @param {string} opts.flagName e.g. COREKNOT_MAIL_STORE
 */
function createLegacyRepository({ MongoModel, entityType, flagName }) {
  const mongoRepo = createTenantRepository(MongoModel);

  const isPostgresEnabled = () => isPostgresStoreEnabled(flagName);

  function toMongoShape(row) {
    const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
    return {
      ...payload,
      _id: row.mongoId,
      id: row.mongoId,
      tenantId: row.tenantId ?? payload.tenantId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      _readSource: 'postgres',
      toObject() {
        const obj = { ...payload, _id: row.mongoId, id: row.mongoId };
        delete obj.toObject;
        return obj;
      },
    };
  }

  async function findPostgresDocs(filter = {}, options = {}) {
    const prisma = await getPrismaClient();
    const tenantId = options.tenantId || getTenantId();
    const where = { entityType };
    if (tenantId) where.tenantId = String(tenantId);

    if (filter._id || filter.id) {
      where.mongoId = String(filter._id || filter.id);
    }

    const rows = await prisma.ckLegacyDocument.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: options.limit,
      skip: options.skip,
    });

    let shaped = rows.map(toMongoShape);

    if (filter.userId) {
      const uidFilter = filter.userId;
      if (uidFilter.$in && Array.isArray(uidFilter.$in)) {
        const set = new Set(uidFilter.$in.map((id) => String(id)));
        shaped = shaped.filter((row) => set.has(String(row.userId)));
      } else {
        const uid = String(uidFilter);
        shaped = shaped.filter((row) => String(row.userId) === uid);
      }
    }
    if (filter.createdAt && typeof filter.createdAt === 'object') {
      const { $gte, $lte } = filter.createdAt;
      shaped = shaped.filter((row) => {
        const rd = row.createdAt ? new Date(row.createdAt) : null;
        if (!rd) return false;
        if ($gte && rd < new Date($gte)) return false;
        if ($lte && rd > new Date($lte)) return false;
        return true;
      });
    }
    if (filter.issueId) {
      const issueId = String(filter.issueId);
      shaped = shaped.filter((row) => String(row.issueId) === issueId);
    }
    if (filter.included !== undefined) {
      shaped = shaped.filter((row) => row.included === filter.included);
    }

    if (options.sortField) {
      const field = options.sortField;
      const dir = options.sortOrder === 'asc' ? 1 : -1;
      shaped.sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * dir;
      });
    }

    return shaped;
  }

  async function mirrorToPostgres(mongoDoc) {
    if (!isPostgresEnabled()) return;
    const prisma = await getPrismaClient();
    const mongoId = mongoDoc._id.toString();
    const plain = mongoDoc.toObject ? mongoDoc.toObject() : { ...mongoDoc };
    delete plain._id;
    delete plain.__v;
    const tenantId = plain.tenantId?.toString?.() || plain.tenantId || getTenantId() || null;

    await prisma.ckLegacyDocument.upsert({
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
  }

  async function deleteMirror(mongoId) {
    if (!isPostgresEnabled()) return;
    const prisma = await getPrismaClient();
    await prisma.ckLegacyDocument.deleteMany({
      where: { entityType, mongoId: String(mongoId) },
    });
  }

  function usePostgres(options = {}) {
    return isPostgresEnabled() && !options.bypass;
  }

  function hasComplexMongoFilter(filter = {}) {
    if (filter.$or || filter.$and || filter.date || filter.$gte || filter.$lte) return true;
    if (filter.userId && typeof filter.userId === 'object' && !filter.userId.$in) return true;
    if (filter.createdAt && typeof filter.createdAt === 'object') return false;
    return false;
  }

  function chainableQuery(rowsOrPromise, defaultSort = null) {
    let sortSpec = defaultSort;
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
      then: (resolve, reject) => promise().then(resolve, reject),
    };
    return chain;
  }

  async function writePrimary(doc) {
    const mongoDoc = asMongoDoc(doc);
    await mirrorToPostgres(mongoDoc);
    if (shouldMirrorMongo()) {
      return mongoRepo.create({ ...doc, _id: mongoDoc._id });
    }
    return toMongoShape({
      mongoId: mongoDoc._id,
      tenantId: mongoDoc.tenantId,
      payload: mongoDoc.toObject ? mongoDoc.toObject() : { ...mongoDoc },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return {
    entityType,
    flagName,
    isPostgresEnabled,

    find(filter = {}, options = {}) {
      if (!usePostgres(options) || hasComplexMongoFilter(filter)) {
        return mongoRepo.find(filter, options);
      }
      return chainableQuery(findPostgresDocs(filter, options));
    },

    findOne(filter = {}, options = {}) {
      if (!usePostgres(options) || hasComplexMongoFilter(filter)) {
        return mongoRepo.findOne(filter, options);
      }
      return chainableQuery(
        findPostgresDocs(filter, { ...options, limit: 1 }).then((r) => r[0] || null),
      );
    },

    findById(id, options = {}) {
      return this.findOne({ _id: id }, options);
    },

    countDocuments(filter = {}, options = {}) {
      if (!usePostgres(options) || hasComplexMongoFilter(filter)) {
        return mongoRepo.countDocuments(filter, options);
      }
      return findPostgresDocs(filter, options).then((rows) => rows.length);
    },

    async create(doc) {
      if (shouldWritePostgresFirst(isPostgresEnabled)) {
        return writePrimary(doc);
      }
      const created = await mongoRepo.create(doc);
      await mirrorToPostgres(created);
      return created;
    },

    async findOneAndUpdate(filter, update, options = {}) {
      if (shouldWritePostgresFirst(isPostgresEnabled)) {
        const existing = await this.findOne(filter, options);
        if (!existing) return null;
        const merged = { ...existing.toObject?.() || existing, ...update.$set, ...update };
        delete merged._id;
        await mirrorToPostgres(asMongoDoc({ ...merged, _id: existing._id }));
        if (shouldMirrorMongo()) {
          return mongoRepo.findOneAndUpdate(filter, update, options);
        }
        return { ...existing, ...merged };
      }
      const updated = await mongoRepo.findOneAndUpdate(filter, update, options);
      if (updated) await mirrorToPostgres(updated);
      return updated;
    },

    async findByIdAndUpdate(id, update, options = {}) {
      return this.findOneAndUpdate({ _id: id }, update, options);
    },

    async updateOne(filter, update, options = {}) {
      return this.findOneAndUpdate(filter, update, options);
    },

    async deleteOne(filter, options = {}) {
      const doc = await this.findOne(filter, options);
      if (!doc) return null;
      if (shouldWritePostgresFirst(isPostgresEnabled)) {
        await deleteMirror(doc._id);
        if (shouldMirrorMongo()) {
          return mongoRepo.deleteOne(filter, options);
        }
        return { deletedCount: 1 };
      }
      const result = await mongoRepo.deleteOne(filter, options);
      await deleteMirror(doc._id);
      return result;
    },

    async deleteMany(filter = {}, options = {}) {
      if (shouldWritePostgresFirst(isPostgresEnabled) && !shouldMirrorMongo()) {
        const docs = await findPostgresDocs(filter, options);
        for (const doc of docs) {
          // eslint-disable-next-line no-await-in-loop
          await deleteMirror(doc._id);
        }
        return { deletedCount: docs.length };
      }
      const result = await mongoRepo.deleteMany(filter, options);
      if (isPostgresEnabled()) {
        const docs = await mongoRepo.find(filter, options);
        const list = await Promise.resolve(docs);
        for (const doc of list) {
          // eslint-disable-next-line no-await-in-loop
          await deleteMirror(doc._id);
        }
      }
      return result;
    },

    mirrorToPostgres,
    mongoRepo,
  };
}

module.exports = { createLegacyRepository };
