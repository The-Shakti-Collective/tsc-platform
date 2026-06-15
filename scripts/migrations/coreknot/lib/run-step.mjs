import { connectMongo, closeMongo } from './mongo.mjs';
import { getPrisma, disconnectPrisma } from './prisma.mjs';
import { getPgConfig, logStep, parseCliArgs } from './env.mjs';

/**
 * Run extract → transform → load for one entity.
 * @param {object} config
 * @param {string} config.entity
 * @param {() => Promise<unknown>} config.extract
 * @param {(raw: unknown) => unknown} config.transform
 * @param {(records: unknown[], ctx: object) => Promise<object>} config.load
 */
export async function runPipeline({ entity, extract, transform, load }) {
  const opts = parseCliArgs();
  getPgConfig();

  logStep(entity, opts.dryRun ? 'DRY RUN' : 'EXECUTE', { batchSize: opts.batchSize });

  await connectMongo();
  const prisma = getPrisma();

  try {
    const raw = await extract();
    const records = transform(raw);
    const recordCount = Array.isArray(records)
      ? records.length
      : (records?.projects?.length ??
        records?.workspaces?.length ??
        records?.users?.length ??
        0);
    logStep(entity, `extracted ${recordCount} records`);

    const stats = await load(records, { prisma, ...opts });
    logStep(entity, 'complete', stats);
    return stats;
  } finally {
    await closeMongo();
    await disconnectPrisma();
  }
}
