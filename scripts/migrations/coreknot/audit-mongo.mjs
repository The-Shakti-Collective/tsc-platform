#!/usr/bin/env node
/**
 * Mongo audit helper — connection test + collection counts for migration docs.
 * Usage: node scripts/migrations/coreknot/audit-mongo.mjs [--json]
 */
import { closeMongo, getMongoDb } from './lib/mongo.mjs';
import { getMongoConfig, logStep } from './lib/env.mjs';

const P0_COLLECTIONS = [
  'tenants',
  'users',
  'artists',
  'leads',
  'projects',
  'tasks',
  'artistinquiries',
  'artistgigs',
];

async function main() {
  const { uri, dbName } = getMongoConfig();
  const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  logStep('audit', `connecting db=${dbName} uri=${masked}`);

  const db = await getMongoDb();
  await db.command({ ping: 1 });
  logStep('audit', 'ping ok');

  const collections = (await db.listCollections().toArray())
    .map((c) => c.name)
    .sort();

  const counts = {};
  for (const name of collections) {
    counts[name] = await db.collection(name).estimatedDocumentCount();
  }

  const p0 = Object.fromEntries(
    P0_COLLECTIONS.map((name) => [name, counts[name] ?? 0]),
  );

  const payload = {
    dbName,
    collectionCount: collections.length,
    totalEstimatedDocuments: Object.values(counts).reduce((a, b) => a + b, 0),
    p0Collections: p0,
    collections,
    counts,
    sampledAt: new Date().toISOString(),
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log('\n=== Mongo audit ===');
    console.log(`Database: ${dbName}`);
    console.log(`Collections: ${collections.length}`);
    console.log('\nP0 migration collections (estimated counts):');
    for (const [name, n] of Object.entries(p0)) {
      console.log(`  ${name}: ${n}`);
    }
  }

  await closeMongo();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
