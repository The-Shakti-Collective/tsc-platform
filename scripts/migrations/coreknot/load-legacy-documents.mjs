/**
 * Bulk-export Mongo collection → ck_legacy_documents (Wave 2 P1 ETL).
 */
import { connectMongo, closeMongo, getMongoDb } from './lib/mongo.mjs';
import { getPrisma, disconnectPrisma } from './lib/prisma.mjs';
import { getPgConfig, logStep, parseCliArgs } from './lib/env.mjs';

function serializeDoc(doc) {
  const plain = { ...doc };
  if (plain._id) {
    plain._id = plain._id.toString();
  }
  for (const [key, value] of Object.entries(plain)) {
    if (value && typeof value === 'object' && value._bsontype === 'ObjectID') {
      plain[key] = value.toString();
    }
    if (value instanceof Date) {
      plain[key] = value.toISOString();
    }
  }
  delete plain.__v;
  return plain;
}

/**
 * @param {{ entityType: string, mongoCollection: string, dryRun?: boolean, batchSize?: number }} config
 */
export async function runLegacyDocumentsMigration(config) {
  const opts = parseCliArgs();
  const dryRun = config.dryRun ?? opts.dryRun;
  const batchSize = config.batchSize ?? opts.batchSize ?? 100;
  const { entityType, mongoCollection } = config;

  getPgConfig();
  await connectMongo();
  const db = await getMongoDb();
  const prisma = getPrisma();

  const coll = db.collection(mongoCollection);
  const total = await coll.estimatedDocumentCount();
  logStep(entityType, dryRun ? 'DRY RUN' : 'EXECUTE', { mongoCollection, total });

  let processed = 0;
  let created = 0;
  let updated = 0;
  const cursor = coll.find({});

  while (await cursor.hasNext()) {
    const batch = [];
    while (batch.length < batchSize && await cursor.hasNext()) {
      batch.push(await cursor.next());
    }

    for (const doc of batch) {
      const mongoId = doc._id.toString();
      const payload = serializeDoc(doc);
      delete payload._id;
      const tenantId = payload.tenantId?.toString?.() || payload.tenantId || null;

      if (!dryRun) {
        const existing = await prisma.ckLegacyDocument.findUnique({
          where: { entityType_mongoId: { entityType, mongoId } },
        });
        await prisma.ckLegacyDocument.upsert({
          where: { entityType_mongoId: { entityType, mongoId } },
          create: {
            entityType,
            mongoId,
            tenantId,
            payload,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
          },
          update: {
            tenantId,
            payload,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          },
        });
        if (existing) updated += 1;
        else created += 1;
      }
      processed += 1;
    }
  }

  await closeMongo();
  await disconnectPrisma();

  const stats = { entityType, mongoCollection, total, processed, created, updated, dryRun };
  logStep(entityType, 'complete', stats);
  return stats;
}
