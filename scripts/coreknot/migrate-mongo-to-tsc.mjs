#!/usr/bin/env node
/**
 * CoreKnot MongoDB → TSC Postgres (Prisma) — partial migration scaffold.
 *
 * CRM collections (leads, campaigns, mail events, finance OCR, etc.) stay on MongoDB
 * until Prisma schemas exist. This script migrates overlapping workspace entities:
 * users → Person + TscIdentity, projects → Project, tasks → Task.
 *
 * Usage:
 *   MONGODB_URI=... DATABASE_URL=... node scripts/coreknot/migrate-mongo-to-tsc.mjs --dry-run
 *   MONGODB_URI=... DATABASE_URL=... node scripts/coreknot/migrate-mongo-to-tsc.mjs --execute
 *
 * Optional:
 *   COREKNOT_WORKSPACE_ID=cuid   — target workspace (creates default if missing)
 *   MONGODB_DB=taskmaster_production
 */
import { MongoClient } from 'mongodb';
import { PrismaClient } from '@tsc/database/client';

const args = new Set(process.argv.slice(2));
const dryRun = !args.has('--execute');
const dbName = process.env.MONGODB_DB || 'taskmaster_production';
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
const pgUrl = process.env.DATABASE_URL;

if (!mongoUri) {
  console.error('Set MONGODB_URI (or MONGODB_URI_PROD)');
  process.exit(1);
}
if (!pgUrl) {
  console.error('Set DATABASE_URL (Postgres / Neon)');
  process.exit(1);
}

const prisma = new PrismaClient();

const STATUS_MAP = {
  'To Do': 'todo',
  todo: 'todo',
  'In Progress': 'in_progress',
  in_progress: 'in_progress',
  Review: 'review',
  review: 'review',
  Done: 'done',
  done: 'done',
  Blocked: 'blocked',
  blocked: 'blocked',
};

function slugify(name) {
  return String(name || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'project';
}

async function ensureWorkspace(ownerPersonId) {
  if (process.env.COREKNOT_WORKSPACE_ID) {
    const ws = await prisma.workspace.findUnique({
      where: { id: process.env.COREKNOT_WORKSPACE_ID },
    });
    if (!ws) throw new Error(`Workspace ${process.env.COREKNOT_WORKSPACE_ID} not found`);
    return ws;
  }
  const existing = await prisma.workspace.findFirst({
    where: { slug: 'coreknot-migrated' },
  });
  if (existing) return existing;
  if (dryRun) {
    console.log('[dry-run] would create workspace slug=coreknot-migrated');
    return { id: 'dry-run-workspace' };
  }
  return prisma.workspace.create({
    data: {
      slug: 'coreknot-migrated',
      name: 'CoreKnot (migrated)',
      type: 'agency',
      ownerPersonId,
      settings: { source: 'taskmaster_mongo_migration' },
    },
  });
}

async function main() {
  console.log(dryRun ? 'DRY RUN — pass --execute to write' : 'EXECUTE mode');
  const mongo = new MongoClient(mongoUri);
  await mongo.connect();
  const db = mongo.db(dbName);
  const userIdToPerson = new Map();

  const users = await db.collection('users').find({}).limit(5000).toArray();
  console.log(`users: ${users.length}`);

  for (const u of users) {
    const email = (u.email || '').toLowerCase().trim();
    if (!email) continue;
    const legacyId = String(u._id);
    if (dryRun) {
      userIdToPerson.set(legacyId, `person-${legacyId.slice(-6)}`);
      continue;
    }
    let person = await prisma.person.findFirst({ where: { email } });
    if (!person) {
      person = await prisma.person.create({
        data: {
          email,
          displayName: u.name || u.fullName || email.split('@')[0],
          metadata: { legacyMongoUserId: legacyId, coreknotRole: u.role || null },
        },
      });
    } else {
      person = await prisma.person.update({
        where: { id: person.id },
        data: {
          displayName: u.name || u.fullName || undefined,
          metadata: { legacyMongoUserId: legacyId, coreknotRole: u.role || null },
        },
      });
    }
    userIdToPerson.set(legacyId, person.id);
  }

  const ownerPersonId = userIdToPerson.values().next().value;
  if (!ownerPersonId && !dryRun) {
    throw new Error('No users with email found — cannot create workspace owner');
  }
  const workspace = await ensureWorkspace(ownerPersonId || 'dry-run-owner');

  const projects = await db.collection('projects').find({}).limit(2000).toArray();
  console.log(`projects: ${projects.length}`);
  const projectIdMap = new Map();

  for (const p of projects) {
    const legacyId = String(p._id);
    const slug = slugify(p.name || p.title || legacyId);
    if (dryRun) {
      projectIdMap.set(legacyId, `proj-${slug}`);
      continue;
    }
    const row = await prisma.project.upsert({
      where: {
        workspaceId_slug: { workspaceId: workspace.id, slug },
      },
      create: {
        workspaceId: workspace.id,
        slug,
        name: p.name || p.title || slug,
        type: 'general',
        status: 'active',
        metadata: { legacyMongoProjectId: legacyId, ...((p.metadata && typeof p.metadata === 'object') ? p.metadata : {}) },
      },
      update: {
        name: p.name || p.title || slug,
        metadata: { legacyMongoProjectId: legacyId },
      },
    });
    projectIdMap.set(legacyId, row.id);
  }

  const tasks = await db.collection('tasks').find({}).limit(10000).toArray();
  console.log(`tasks: ${tasks.length}`);
  let taskWrites = 0;

  for (const t of tasks) {
    const creatorMongo = t.createdBy ? String(t.createdBy) : null;
    const creatorPersonId = creatorMongo ? userIdToPerson.get(creatorMongo) : null;
    if (!creatorPersonId) continue;

    const projectMongo = t.project ? String(t.project) : null;
    const projectId = projectMongo ? projectIdMap.get(projectMongo) : null;
    const status = STATUS_MAP[t.status] || 'todo';
    const legacyId = String(t._id);

    if (dryRun) {
      taskWrites += 1;
      continue;
    }

    const existing = await prisma.task.findFirst({
      where: {
        metadata: { path: ['legacyMongoTaskId'], equals: legacyId },
      },
    });
    if (existing) continue;

    await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        projectId: projectId || undefined,
        title: t.title || t.name || 'Untitled task',
        description: t.description || t.notes || null,
        status,
        priority: 'medium',
        dueAt: t.dueDate ? new Date(t.dueDate) : undefined,
        createdByPersonId: creatorPersonId,
        metadata: { legacyMongoTaskId: legacyId, legacyStatus: t.status },
      },
    });
    taskWrites += 1;
  }

  console.log(`tasks ${dryRun ? 'would migrate' : 'migrated'}: ${taskWrites}`);
  console.log('');
  console.log('Collections still on MongoDB (use apps/coreknot/server until Prisma schemas land):');
  console.log('  leads, campaigns, mailevents, finance documents, attendance, gamification, datahub, ...');
  console.log('Prod → local sync: pnpm sync:coreknot:prod-local');

  await mongo.close();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
