#!/usr/bin/env node
/**
 * Export CoreKnot Mongo tenants, departments, and users to JSON for local Postgres seed.
 * Output: scripts/migrations/coreknot/out/users-export.json
 *
 * Env: MONGODB_* from apps/coreknot/server/.env (see lib/load-migration-env.mjs).
 */
import './lib/env.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractUsers } from './extract-users.mjs';
import { extractOrganizations } from './extract-organizations.mjs';
import { oid } from './lib/mongo.mjs';
import { toDate } from './lib/utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
const OUT_FILE = path.join(OUT_DIR, 'users-export.json');

function mapTenant(t) {
  const id = oid(t);
  if (!id) return null;
  return {
    id,
    name: String(t.name || 'Default Tenant').trim(),
    domain: t.domain ?? null,
    contactEmail: t.contactEmail ?? null,
    metadata: {
      legacy: true,
    },
    createdAt: toDate(t.createdAt)?.toISOString() ?? null,
    updatedAt: toDate(t.updatedAt)?.toISOString() ?? null,
  };
}

function mapDepartment(d) {
  const id = oid(d);
  if (!id) return null;
  return {
    id,
    tenantId: d.tenantId ? String(d.tenantId) : null,
    name: String(d.name || '').trim(),
    slug: String(d.slug || '').trim().toLowerCase(),
    color: d.color ?? '#3b82f6',
    sortOrder: d.sortOrder ?? 0,
    signupAllowed: d.signupAllowed !== false,
    permissionPreset: d.permissionPreset ?? 'standard',
    pagePermissions: Array.isArray(d.pagePermissions) ? d.pagePermissions.map(String) : [],
    createdAt: toDate(d.createdAt)?.toISOString() ?? null,
  };
}

function mapUser(u) {
  const mongoId = oid(u);
  if (!mongoId || !u.email) return null;
  return {
    mongoId,
    tenantId: u.tenantId ? String(u.tenantId) : null,
    departmentId: u.departmentId ? String(u.departmentId) : null,
    email: String(u.email).trim().toLowerCase(),
    passwordHash: u.password ?? null,
    name: String(u.name || u.email.split('@')[0]).trim(),
    avatar: u.avatar ?? null,
    gender: u.gender ?? null,
    dateOfBirth: toDate(u.dateOfBirth)?.toISOString() ?? null,
    phone: u.phone ?? '',
    repId: u.repId ?? null,
    pagePermissions: Array.isArray(u.pagePermissions) ? u.pagePermissions.map(String) : [],
    mustChangePassword: u.mustChangePassword ?? false,
    passwordChangedAt: toDate(u.passwordChangedAt)?.toISOString() ?? null,
    googleId: u.googleId ?? null,
    googleCalendarLinked: u.googleCalendarLinked ?? false,
    exp: u.exp ?? 0,
    level: u.level ?? 1,
    dailyStreak: u.dailyStreak ?? 0,
    createdAt: toDate(u.createdAt)?.toISOString() ?? null,
    updatedAt: toDate(u.updatedAt)?.toISOString() ?? null,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const [tenantDocs, userPayload] = await Promise.all([
    extractOrganizations(),
    extractUsers(),
  ]);

  const tenants = tenantDocs.map(mapTenant).filter(Boolean);
  const departments = userPayload.departments.map(mapDepartment).filter(Boolean);
  const users = userPayload.users.map(mapUser).filter(Boolean);

  const payload = {
    exportedAt: new Date().toISOString(),
    source: 'coreknot-mongo',
    counts: {
      tenants: tenants.length,
      departments: departments.length,
      users: users.length,
    },
    tenants,
    departments,
    users,
  };

  await writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Exported ${payload.counts.tenants} tenants, ${payload.counts.departments} departments, ${payload.counts.users} users`);
  console.log(`→ ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
