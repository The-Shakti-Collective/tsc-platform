const { getPrismaClient } = require('../infrastructure/postgres/prismaClient');
const { createLegacyRepository } = require('./createLegacyRepository');
const { getTenantId } = require('../utils/tenantContext');
const { asMongoDoc, newLegacyMongoId } = require('../infrastructure/postgres/writeStrategy');

function ensureRecipientIds(recipients = []) {
  return recipients.map((r) => ({
    ...r,
    _id: r._id ? String(r._id) : newLegacyMongoId(),
  }));
}

function toPlainCampaign(row) {
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  return {
    ...payload,
    _id: row.mongoId,
    id: row.mongoId,
    tenantId: row.tenantId ?? payload.tenantId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function setNested(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {};
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
}

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function incNested(obj, path, delta) {
  const current = Number(getNested(obj, path) || 0);
  setNested(obj, path, current + delta);
}

function recipientMatchesFilter(recipient, filter) {
  if (!filter || typeof filter !== 'object') return true;
  for (const [key, val] of Object.entries(filter)) {
    const field = key.replace(/^elem\./, '');
    const actual = recipient[field];
    if (val && typeof val === 'object') {
      if (val.$in && !val.$in.some((id) => String(id) === String(actual))) return false;
      if (val.$nin && val.$nin.some((id) => String(id) === String(actual))) return false;
      if (val.$ne !== undefined && actual === val.$ne) return false;
    } else if (String(actual) !== String(val)) {
      return false;
    }
  }
  return true;
}

function applyArrayFilters(recipients, arrayFilters = []) {
  if (!arrayFilters.length) return recipients.map((r) => ({ ...r }));
  return recipients.map((r) => ({ ...r }));
}

function applyMongoUpdate(doc, update = {}, arrayFilters = []) {
  const next = { ...doc, recipients: Array.isArray(doc.recipients) ? doc.recipients.map((r) => ({ ...r })) : [] };

  if (update.$set) {
    for (const [key, val] of Object.entries(update.$set)) {
      if (key.startsWith('recipients.$[elem].')) {
        const field = key.slice('recipients.$[elem].'.length);
        next.recipients = next.recipients.map((r) => (
          arrayFilters.some((filter) => recipientMatchesFilter(r, filter))
            ? { ...r, [field]: val }
            : r
        ));
      } else {
        setNested(next, key, val);
      }
    }
  }

  if (update.$inc) {
    for (const [key, delta] of Object.entries(update.$inc)) {
      incNested(next, key, Number(delta) || 0);
    }
  }

  if (update.$push) {
    for (const [key, val] of Object.entries(update.$push)) {
      const existing = getNested(next, key);
      const arr = Array.isArray(existing) ? [...existing] : [];
      arr.push(val);
      setNested(next, key, arr);
    }
  }

  return next;
}

function docMatchesFilter(doc, filter = {}) {
  if (filter._id || filter.id) {
    const id = String(filter._id?.$oid || filter._id || filter.id);
    if (String(doc._id) !== id) return false;
  }
  if (filter.campaignId && doc.campaignId !== filter.campaignId) return false;
  if (filter.createdBy && String(doc.createdBy) !== String(filter.createdBy)) return false;
  if (filter.status) {
    if (filter.status.$in) {
      if (!filter.status.$in.includes(doc.status)) return false;
    } else if (doc.status !== filter.status) return false;
  }
  for (const [key, val] of Object.entries(filter)) {
    if (['_id', 'id', 'campaignId', 'createdBy', 'status', '$or'].includes(key)) continue;
    const actual = getNested(doc, key);
    if (val && typeof val === 'object') {
      if (val.$in && !val.$in.includes(actual)) return false;
      if (val.$ne !== undefined && actual === val.$ne) return false;
      if (val.$nin && val.$nin.includes(actual)) return false;
    } else if (actual !== val) {
      return false;
    }
  }
  if (filter['recipients.messageId']) {
    const mid = filter['recipients.messageId'];
    const found = (doc.recipients || []).some((r) => r.messageId === mid);
    if (!found) return false;
  }
  if (filter['recipients.email']) {
    const pattern = filter['recipients.email'];
    const email = String(pattern).replace(/^\^|\$$/gi, '').toLowerCase();
    const found = (doc.recipients || []).some((r) => String(r.email || '').toLowerCase() === email);
    if (!found) return false;
  }
  if (filter.$or) {
    return filter.$or.some((clause) => docMatchesFilter(doc, clause));
  }
  return true;
}

function applyAggregatePipeline(docs, pipeline = []) {
  let rows = docs.map((d) => ({ ...d }));

  for (const stage of pipeline) {
    if (stage.$match) {
      rows = rows.filter((doc) => docMatchesFilter(doc, stage.$match));
    }
    if (stage.$unwind) {
      const field = String(stage.$unwind).replace(/^\$/, '');
      const expanded = [];
      for (const doc of rows) {
        const arr = getNested(doc, field) || [];
        if (!arr.length) {
          expanded.push({ ...doc, [field]: null });
        } else {
          for (const item of arr) {
            expanded.push({ ...doc, [field.replace(/^recipients$/, 'recipients')]: item, recipients: item });
          }
        }
      }
      rows = expanded;
    }
    if (stage.$addFields) {
      rows = rows.map((doc) => {
        const next = { ...doc };
        for (const [key, expr] of Object.entries(stage.$addFields)) {
          if (expr?.$size?.$ifNull) {
            const field = String(expr.$size.$ifNull[0]).replace(/^\$/, '');
            next[key] = (getNested(doc, field) || []).length;
          }
        }
        return next;
      });
    }
    if (stage.$project) {
      rows = rows.map((doc) => {
        const next = {};
        const excludeMode = Object.values(stage.$project).every((v) => v === 0);
        if (excludeMode) {
          Object.assign(next, doc);
          for (const [key, val] of Object.entries(stage.$project)) {
            if (val === 0) delete next[key];
          }
        } else {
          for (const [key, expr] of Object.entries(stage.$project)) {
            if (typeof expr === 'string' && expr.startsWith('$')) {
              next[key] = getNested(doc, expr.slice(1));
            } else if (expr === 1 || expr === true) {
              next[key] = doc[key];
            }
          }
        }
        return next;
      });
    }
    if (stage.$group) {
      const groups = new Map();
      for (const doc of rows) {
        let groupKey = 'all';
        if (stage.$group._id?.$ifNull) {
          groupKey = getNested(doc, String(stage.$group._id.$ifNull[0]).replace(/^\$/, '')) || stage.$group._id.$ifNull[1];
        } else if (stage.$group._id?.$toLower) {
          const inner = stage.$group._id.$toLower.$trim?.input;
          const field = String(inner || '').replace(/^\$/, '');
          groupKey = String(getNested(doc, field) || '').toLowerCase().trim();
        } else if (typeof stage.$group._id === 'string') {
          groupKey = getNested(doc, stage.$group._id.replace(/^\$/, ''));
        } else if (stage.$group._id === null) {
          groupKey = null;
        }
        const key = groupKey == null ? '__null__' : String(groupKey);
        if (!groups.has(key)) groups.set(key, { _id: groupKey, count: 0, hasEngaged: 0, totalSent: 0, totalOpens: 0, totalClicks: 0 });
        const g = groups.get(key);
        for (const [outKey, expr] of Object.entries(stage.$group)) {
          if (outKey === '_id') continue;
          if (expr?.$sum !== undefined) {
            let src = expr.$sum;
            if (expr.$sum?.$ifNull) {
              src = getNested(doc, String(expr.$sum.$ifNull[0]).replace(/^\$/, ''));
              if (src == null) src = expr.$sum.$ifNull[1];
            }
            const fieldName = outKey === 'count' ? 'count' : outKey;
            g[fieldName] = (g[fieldName] || 0) + (Number(src) || 0);
          }
          if (expr?.$max?.$cond) {
            const [, cond] = expr.$max.$cond;
            if (Array.isArray(cond) && cond[0]?.$in) {
              const status = getNested(doc, 'recipients.status') || doc.recipients?.status;
              if (cond[0].$in.includes(status)) g[outKey] = 1;
            }
          }
        }
        if (g.count !== undefined && stage.$group.count === undefined) g.count += 1;
      }
      rows = Array.from(groups.values());
    }
    if (stage.$sort) {
      const [[field, dir]] = Object.entries(stage.$sort);
      rows.sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (dir === -1 ? -1 : 1);
      });
    }
    if (stage.$limit) {
      rows = rows.slice(0, stage.$limit);
    }
    if (stage.$count) {
      rows = [{ [stage.$count]: rows.length }];
    }
  }

  return rows;
}

function wrapCampaignDoc(doc, repo) {
  if (!doc || typeof doc !== 'object') return doc;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  return {
    ...plain,
    recipients: Array.isArray(plain.recipients) ? plain.recipients.map((r) => ({ ...r })) : [],
    toObject() {
      const { save, set, toObject, ...rest } = this;
      return { ...rest };
    },
    set(key, val) {
      if (typeof key === 'object') {
        Object.assign(this, key);
      } else {
        this[key] = val;
      }
    },
    async save() {
      return repo.saveDocument(this);
    },
  };
}

/**
 * Campaign repository — CkLegacyDocument-backed when COREKNOT_MAIL_STORE=postgres.
 */
function createCampaignRepository({ MongoModel, entityType, flagName }) {
  const legacyRepo = createLegacyRepository({ MongoModel, entityType, flagName });

  async function loadAllPostgresDocs(options = {}) {
    const prisma = await getPrismaClient();
    const where = { entityType };
    if (!options.bypass) {
      const tenantId = options.tenantId || getTenantId();
      if (tenantId) where.tenantId = String(tenantId);
    }
    const rows = await prisma.ckLegacyDocument.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(toPlainCampaign);
  }

  async function loadPostgresDocById(id, options = {}) {
    const prisma = await getPrismaClient();
    const row = await prisma.ckLegacyDocument.findUnique({
      where: { entityType_mongoId: { entityType, mongoId: String(id) } },
    });
    if (!row) return null;
    if (!options.bypass) {
      const tenantId = options.tenantId || getTenantId();
      if (tenantId && row.tenantId && String(row.tenantId) !== String(tenantId)) return null;
    }
    return toPlainCampaign(row);
  }

  async function persistPostgresDoc(doc, options = {}) {
    const prisma = await getPrismaClient();
    const mongoId = String(doc._id || doc.id);
    const plain = doc.toObject ? doc.toObject() : { ...doc };
    delete plain._id;
    delete plain.id;
    delete plain.toObject;
    delete plain.save;
    delete plain.set;
    delete plain._readSource;
    const tenantId = plain.tenantId?.toString?.() || plain.tenantId || getTenantId() || null;

    await prisma.ckLegacyDocument.upsert({
      where: { entityType_mongoId: { entityType, mongoId } },
      create: { entityType, mongoId, tenantId, payload: plain },
      update: { tenantId, payload: plain },
    });

    return wrapCampaignDoc({ ...plain, _id: mongoId }, repo);
  }

  function chainableQuery(rowsOrPromise, queryOptions = {}) {
    let selectFields;
    let sortSpec;
    let limitVal;
    let skipVal;
    let leanResult = false;

    const promise = async () => {
      let doc = await Promise.resolve(rowsOrPromise);
      if (Array.isArray(doc)) {
        let list = doc;
        if (sortSpec) {
          const [[field, dir]] = Object.entries(typeof sortSpec === 'string'
            ? { [sortSpec.replace('-', '')]: sortSpec.startsWith('-') ? -1 : 1 }
            : sortSpec);
          list = [...list].sort((a, b) => {
            const av = a[field];
            const bv = b[field];
            if (av === bv) return 0;
            return (av > bv ? 1 : -1) * (dir === -1 ? -1 : 1);
          });
        }
        if (skipVal) list = list.slice(skipVal);
        if (limitVal) list = list.slice(0, limitVal);
        return leanResult ? list : list.map((d) => wrapCampaignDoc(d, repo));
      }

      if (!doc) return null;
      if (selectFields) {
        const include = selectFields.startsWith('-');
        const fields = selectFields.replace(/^-/, '').split(' ').filter(Boolean);
        if (include) {
          for (const f of fields) delete doc[f];
        } else {
          const picked = {};
          for (const f of ['_id', ...fields]) {
            if (doc[f] !== undefined) picked[f] = doc[f];
          }
          doc = picked;
        }
      }
      return leanResult ? doc : wrapCampaignDoc(doc, repo);
    };

    const chain = {
      select(fields) { selectFields = fields; return chain; },
      populate() { return chain; },
      sort(spec) { sortSpec = spec; return chain; },
      skip(n) { skipVal = n; return chain; },
      limit(n) { limitVal = n; return chain; },
      setOptions(opts) { Object.assign(queryOptions, opts); return chain; },
      lean() { leanResult = true; return promise(); },
      session() { return chain; },
      then(resolve, reject) { return promise().then(resolve, reject); },
    };
    return chain;
  }

  async function findPostgresMatching(filter = {}, options = {}) {
    let docs = await loadAllPostgresDocs(options);
    if (filter.createdBy) {
      docs = docs.filter((d) => String(d.createdBy) === String(filter.createdBy));
    }
    if (filter.campaignId) {
      docs = docs.filter((d) => d.campaignId === filter.campaignId);
    }
    if (filter._id || filter.id) {
      docs = docs.filter((d) => String(d._id) === String(filter._id || filter.id));
    }
    if (filter['recipients.messageId']) {
      const mid = filter['recipients.messageId'];
      docs = docs.filter((d) => (d.recipients || []).some((r) => r.messageId === mid));
    }
    if (filter['recipients.email']) {
      const raw = filter['recipients.email'];
      const email = typeof raw === 'string'
        ? raw.replace(/^\^|\$$/gi, '').toLowerCase()
        : null;
      if (email) {
        docs = docs.filter((d) => (d.recipients || []).some((r) => String(r.email || '').toLowerCase() === email));
      }
    }
    if (filter.status?.$in) {
      docs = docs.filter((d) => filter.status.$in.includes(d.status));
    }
    return docs;
  }

  const repo = {
    entityType,
    flagName,
    isPostgresEnabled: legacyRepo.isPostgresEnabled,

    find(filter = {}, options = {}) {
      if (!legacyRepo.isPostgresEnabled()) {
        return legacyRepo.find(filter, options);
      }
      return chainableQuery(findPostgresMatching(filter, options), options);
    },

    findOne(filter = {}, options = {}) {
      if (legacyRepo.isPostgresEnabled()) {
        return chainableQuery(
          findPostgresMatching(filter, options).then((rows) => rows[0] || null),
          options,
        );
      }
      return legacyRepo.findOne(filter, options);
    },

    findById(id, options = {}) {
      if (legacyRepo.isPostgresEnabled()) {
        return chainableQuery(loadPostgresDocById(id, options), options);
      }
      return legacyRepo.findById(id, options);
    },

    async exists(filter = {}, options = {}) {
      const doc = await repo.findOne(filter, options).lean();
      return doc != null;
    },

    countDocuments(filter = {}, options = {}) {
      if (legacyRepo.isPostgresEnabled()) {
        return findPostgresMatching(filter, options).then((rows) => rows.length);
      }
      return legacyRepo.countDocuments(filter, options);
    },

    async create(doc) {
      const withRecipients = {
        ...doc,
        recipients: ensureRecipientIds(doc.recipients),
      };
      if (legacyRepo.isPostgresEnabled()) {
        const mongoDoc = asMongoDoc(withRecipients);
        const saved = await persistPostgresDoc(mongoDoc, { bypass: true });
        if (legacyRepo.mongoRepo && require('../infrastructure/postgres/writeStrategy').shouldMirrorMongo()) {
          await legacyRepo.mongoRepo.create({ ...withRecipients, _id: mongoDoc._id });
        }
        return saved;
      }
      return legacyRepo.create(withRecipients);
    },

    async saveDocument(doc) {
      if (legacyRepo.isPostgresEnabled()) {
        return persistPostgresDoc(doc, { bypass: true });
      }
      if (doc.save && doc.constructor?.name !== 'Object') {
        return doc.save();
      }
      return legacyRepo.findByIdAndUpdate(doc._id, { $set: doc.toObject?.() || doc });
    },

    async updateOne(filter, update, options = {}) {
      if (legacyRepo.isPostgresEnabled()) {
        const doc = await repo.findOne(filter, { ...options, bypass: true }).lean();
        if (!doc) return { matchedCount: 0, modifiedCount: 0 };
        const merged = applyMongoUpdate(doc, update, options.arrayFilters);
        await persistPostgresDoc({ ...merged, _id: doc._id }, { bypass: true });
        return { matchedCount: 1, modifiedCount: 1 };
      }
      return legacyRepo.mongoRepo.updateOne(filter, update, options);
    },

    async findByIdAndUpdate(id, update, options = {}) {
      if (legacyRepo.isPostgresEnabled()) {
        await repo.updateOne({ _id: id }, update, options);
        return repo.findById(id, options).lean();
      }
      return legacyRepo.findByIdAndUpdate(id, update, options);
    },

    async findOneAndUpdate(filter, update, options = {}) {
      if (legacyRepo.isPostgresEnabled()) {
        const existing = await repo.findOne(filter, { ...options, bypass: true }).lean();
        if (!existing) return null;
        const merged = applyMongoUpdate(existing, update, options.arrayFilters);
        await persistPostgresDoc({ ...merged, _id: existing._id }, { bypass: true });
        return options.new === false ? existing : merged;
      }
      return legacyRepo.findOneAndUpdate(filter, update, options);
    },

    async findByIdAndDelete(id, options = {}) {
      if (legacyRepo.isPostgresEnabled()) {
        const doc = await repo.findById(id, options).lean();
        if (!doc) return null;
        const prisma = await getPrismaClient();
        await prisma.ckLegacyDocument.deleteMany({
          where: { entityType, mongoId: String(id) },
        });
        return doc;
      }
      return legacyRepo.findByIdAndDelete(id, options);
    },

    async deleteMany(filter = {}, options = {}) {
      if (legacyRepo.isPostgresEnabled()) {
        const docs = await findPostgresMatching(filter, options);
        const prisma = await getPrismaClient();
        if (docs.length) {
          await prisma.ckLegacyDocument.deleteMany({
            where: { entityType, mongoId: { in: docs.map((d) => String(d._id)) } },
          });
        }
        return { deletedCount: docs.length };
      }
      return legacyRepo.deleteMany(filter, options);
    },

    aggregate(pipeline = [], options = {}) {
      if (legacyRepo.isPostgresEnabled()) {
        return loadAllPostgresDocs(options).then((docs) => applyAggregatePipeline(docs, pipeline));
      }
      return legacyRepo.mongoRepo.aggregate(pipeline, options);
    },

    insertMany: legacyRepo.insertMany.bind(legacyRepo),
    mirrorToPostgres: legacyRepo.mirrorToPostgres.bind(legacyRepo),
    mongoRepo: legacyRepo.mongoRepo,
  };

  return repo;
}

module.exports = { createCampaignRepository, ensureRecipientIds, applyMongoUpdate };
