import { PrismaClient } from '@prisma/client';
import { getTypesenseClient, isTypesenseConfigured, runIncrementalSync } from '../src/index.js';
import { loadSearchEnv } from './load-env.js';

async function main(): Promise<void> {
  loadSearchEnv();

  if (!process.env.DATABASE_URL?.trim()) {
    console.error('DATABASE_URL is required. Set it in .env or the shell.');
    process.exit(1);
  }

  if (!isTypesenseConfigured()) {
    console.error(
      'Typesense is not configured. Set TYPESENSE_HOST and TYPESENSE_API_KEY in .env.',
    );
    process.exit(1);
  }

  const client = getTypesenseClient();
  if (!client) {
    console.error('Failed to create Typesense client.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const result = await runIncrementalSync({ client, prisma });
    console.log('Typesense incremental sync complete.');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('search:index failed:', error);
  process.exit(1);
});
