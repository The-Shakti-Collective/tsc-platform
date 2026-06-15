/**
 * Idempotent dev stub user seed for local auth harness (V-002).
 * Chains: User → Person → OrganizationMember → Organization (+ Workspace).
 *
 * Usage: pnpm seed:dev-user
 * Requires: DATABASE_URL (loads repo root `.env` when unset in shell).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../..');

/** Canonical stub clerk IDs used in probes and .env examples. */
export const DEV_STUB_CLERK_USER_IDS = [
  'user_dev_stub',
  'stub-user',
  'stub-dev-user',
] as const;

export const DEV_SEED_IDS = {
  organizationId: 'seed_org_dev_stub',
  organizationSlug: 'dev-stub-org',
  workspaceSlug: 'dev-stub-workspace',
} as const;

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function loadEnv(): void {
  const candidates = [
    join(REPO_ROOT, '.env'),
    join(REPO_ROOT, 'apps/api/.env'),
    join(REPO_ROOT, 'packages/database/.env'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const parsed = parseEnvFile(readFileSync(file, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function personIdForStub(clerkUserId: string): string {
  return `seed_person_${clerkUserId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

function workspaceIdForStub(clerkUserId: string): string {
  return `seed_workspace_${clerkUserId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

async function main(): Promise<void> {
  loadEnv();

  if (!process.env.DATABASE_URL?.trim()) {
    console.error('DATABASE_URL is required. Set it in .env or the shell.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const organization = await prisma.organization.upsert({
      where: { slug: DEV_SEED_IDS.organizationSlug },
      create: {
        id: DEV_SEED_IDS.organizationId,
        name: 'Dev Stub Organization',
        slug: DEV_SEED_IDS.organizationSlug,
        type: 'internal',
        metadata: { seededBy: 'seed-dev-user', purpose: 'v-002-auth-harness' },
      },
      update: {
        name: 'Dev Stub Organization',
        type: 'internal',
      },
    });

    const seededUsers: Array<{
      clerkUserId: string;
      personId: string;
      workspaceId: string;
    }> = [];

    for (const clerkUserId of DEV_STUB_CLERK_USER_IDS) {
      const personId = personIdForStub(clerkUserId);
      const workspaceId = workspaceIdForStub(clerkUserId);
      const workspaceSlug = `${DEV_SEED_IDS.workspaceSlug}-${clerkUserId.replace(/[^a-z0-9-]/gi, '-')}`;

      const person = await prisma.person.upsert({
        where: { id: personId },
        create: {
          id: personId,
          name: 'Dev Stub User',
          displayName: `Dev Stub (${clerkUserId})`,
          email: `${clerkUserId}@dev.local`,
          metadata: { seededBy: 'seed-dev-user', clerkUserId },
        },
        update: {
          displayName: `Dev Stub (${clerkUserId})`,
          email: `${clerkUserId}@dev.local`,
        },
      });

      await prisma.user.upsert({
        where: { clerkUserId },
        create: {
          clerkUserId,
          personId: person.id,
          platformRole: 'ORG_OWNER',
        },
        update: {
          personId: person.id,
          platformRole: 'ORG_OWNER',
        },
      });

      await prisma.organizationMember.upsert({
        where: {
          organizationId_personId: {
            organizationId: organization.id,
            personId: person.id,
          },
        },
        create: {
          organizationId: organization.id,
          personId: person.id,
          role: 'ORG_OWNER',
          status: 'active',
        },
        update: {
          role: 'ORG_OWNER',
          status: 'active',
        },
      });

      const workspace = await prisma.workspace.upsert({
        where: { slug: workspaceSlug },
        create: {
          id: workspaceId,
          slug: workspaceSlug,
          name: `Dev Workspace (${clerkUserId})`,
          ownerPersonId: person.id,
          type: 'personal',
          settings: { seededBy: 'seed-dev-user' },
        },
        update: {
          name: `Dev Workspace (${clerkUserId})`,
          ownerPersonId: person.id,
          type: 'personal',
        },
      });

      await prisma.workspaceMember.upsert({
        where: {
          workspaceId_personId: {
            workspaceId: workspace.id,
            personId: person.id,
          },
        },
        create: {
          workspaceId: workspace.id,
          personId: person.id,
          role: 'owner',
          status: 'active',
        },
        update: {
          role: 'owner',
          status: 'active',
        },
      });

      seededUsers.push({
        clerkUserId,
        personId: person.id,
        workspaceId: workspace.id,
      });
    }

    console.log('Dev stub user seed complete.');
    console.log(JSON.stringify({ organization, users: seededUsers }, null, 2));
    console.log('\nProbe examples:');
    console.log(
      `  curl -H "X-Stub-User-Id: user_dev_stub" "http://localhost:4000/api/crm/leads?organizationId=${organization.id}"`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('seed-dev-user failed:', error);
  process.exit(1);
});
