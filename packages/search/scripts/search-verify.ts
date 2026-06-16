import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import {
  getTypesenseClient,
  isTypesenseConfigured,
  searchAll,
  searchCollection,
} from '../src/index.js';
import { loadSearchEnv } from './load-env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../..');

async function main(): Promise<void> {
  loadSearchEnv();

  if (!isTypesenseConfigured()) {
    console.error('Typesense not configured — skipping live verify.');
    process.exit(1);
  }

  const client = getTypesenseClient();
  if (!client) {
    console.error('Failed to create Typesense client.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const checks: Array<Record<string, unknown>> = [];

  try {
    const artist = await prisma.artist.findFirst({ orderBy: { updatedAt: 'desc' } });
    const opportunity = await prisma.opportunity.findFirst({ orderBy: { updatedAt: 'desc' } });
    const project = await prisma.project.findFirst({ orderBy: { updatedAt: 'desc' } });

    if (artist) {
      const term = artist.displayName ?? artist.name;
      const result = await searchCollection(client, 'artists', term.split(' ')[0], 5);
      checks.push({
        type: 'artists',
        query: term.split(' ')[0],
        found: result.found,
        sample: result.hits[0]?.document?.id ?? null,
      });
    }

    if (opportunity) {
      const term = opportunity.title;
      const result = await searchCollection(client, 'opportunities', term.split(' ')[0], 5);
      checks.push({
        type: 'opportunities',
        query: term.split(' ')[0],
        found: result.found,
        sample: result.hits[0]?.document?.id ?? null,
      });
    }

    if (project) {
      const term = project.name;
      const result = await searchCollection(client, 'projects', term.split(' ')[0], 5);
      checks.push({
        type: 'projects',
        query: term.split(' ')[0],
        found: result.found,
        sample: result.hits[0]?.document?.id ?? null,
      });
    }

    const unified = await searchAll(client, 'demo', 10);
    checks.push({
      type: 'unified',
      query: 'demo',
      found: unified.found,
      hits: unified.hits.length,
    });

    const reportPath = join(REPO_ROOT, '.agents/reports/search-verify.json');
    const report = {
      verifiedAt: new Date().toISOString(),
      configured: true,
      checks,
    };

    console.log(JSON.stringify(report, null, 2));

    const failed = checks.filter((check) => (check.found as number) < 1);
    if (failed.length > 0 && checks.length > 0) {
      console.error('Some search checks returned zero results:', failed);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('search:verify failed:', error);
  process.exit(1);
});
