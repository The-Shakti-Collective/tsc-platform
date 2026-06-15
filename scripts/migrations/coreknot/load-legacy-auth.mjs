#!/usr/bin/env node
/**
 * Load users-export.json into CkLegacy* Postgres tables (local auth seed).
 *
 * Env: DATABASE_URL from repo root .env (see lib/load-migration-env.mjs).
 */
import { getPgConfig } from './lib/env.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPrisma, disconnectPrisma } from './lib/prisma.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INPUT = path.join(__dirname, 'out', 'users-export.json');

function parseDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function main() {
  getPgConfig();

  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const raw = await readFile(inputPath, 'utf8');
  const payload = JSON.parse(raw);

  const prisma = getPrisma();
  let tenantCount = 0;
  let deptCount = 0;
  let userCount = 0;

  for (const tenant of payload.tenants ?? []) {
    await prisma.ckLegacyTenant.upsert({
      where: { id: tenant.id },
      create: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        contactEmail: tenant.contactEmail,
        metadata: tenant.metadata ?? {},
        createdAt: parseDate(tenant.createdAt),
        updatedAt: parseDate(tenant.updatedAt),
      },
      update: {
        name: tenant.name,
        domain: tenant.domain,
        contactEmail: tenant.contactEmail,
        metadata: tenant.metadata ?? {},
        updatedAt: parseDate(tenant.updatedAt) ?? new Date(),
      },
    });
    tenantCount += 1;
  }

  for (const dept of payload.departments ?? []) {
    if (!dept.tenantId) continue;
    await prisma.ckLegacyDepartment.upsert({
      where: { id: dept.id },
      create: {
        id: dept.id,
        tenantId: dept.tenantId,
        name: dept.name,
        slug: dept.slug,
        color: dept.color ?? '#3b82f6',
        sortOrder: dept.sortOrder ?? 0,
        signupAllowed: dept.signupAllowed !== false,
        permissionPreset: dept.permissionPreset ?? 'standard',
        pagePermissions: dept.pagePermissions ?? [],
        createdAt: parseDate(dept.createdAt),
      },
      update: {
        name: dept.name,
        slug: dept.slug,
        color: dept.color ?? '#3b82f6',
        sortOrder: dept.sortOrder ?? 0,
        signupAllowed: dept.signupAllowed !== false,
        permissionPreset: dept.permissionPreset ?? 'standard',
        pagePermissions: dept.pagePermissions ?? [],
        updatedAt: new Date(),
      },
    });
    deptCount += 1;
  }

  for (const user of payload.users ?? []) {
    if (!user.tenantId || !user.mongoId || !user.email) continue;
    await prisma.ckLegacyStaffUser.upsert({
      where: { mongoId: user.mongoId },
      create: {
        mongoId: user.mongoId,
        tenantId: user.tenantId,
        departmentId: user.departmentId ?? null,
        email: user.email,
        passwordHash: user.passwordHash ?? null,
        name: user.name,
        avatar: user.avatar,
        gender: user.gender,
        dateOfBirth: parseDate(user.dateOfBirth),
        phone: user.phone ?? '',
        repId: user.repId,
        pagePermissions: user.pagePermissions ?? [],
        mustChangePassword: user.mustChangePassword ?? false,
        passwordChangedAt: parseDate(user.passwordChangedAt),
        googleId: user.googleId,
        googleCalendarLinked: user.googleCalendarLinked ?? false,
        exp: user.exp ?? 0,
        level: user.level ?? 1,
        dailyStreak: user.dailyStreak ?? 0,
        metadata: {},
        createdAt: parseDate(user.createdAt),
        updatedAt: parseDate(user.updatedAt),
      },
      update: {
        tenantId: user.tenantId,
        departmentId: user.departmentId ?? null,
        email: user.email,
        passwordHash: user.passwordHash ?? null,
        name: user.name,
        avatar: user.avatar,
        gender: user.gender,
        dateOfBirth: parseDate(user.dateOfBirth),
        phone: user.phone ?? '',
        repId: user.repId,
        pagePermissions: user.pagePermissions ?? [],
        mustChangePassword: user.mustChangePassword ?? false,
        passwordChangedAt: parseDate(user.passwordChangedAt),
        googleId: user.googleId,
        googleCalendarLinked: user.googleCalendarLinked ?? false,
        exp: user.exp ?? 0,
        level: user.level ?? 1,
        dailyStreak: user.dailyStreak ?? 0,
        updatedAt: parseDate(user.updatedAt) ?? new Date(),
      },
    });
    userCount += 1;
  }

  console.log(`Seeded ${tenantCount} tenants, ${deptCount} departments, ${userCount} users from ${inputPath}`);
  await disconnectPrisma();
}

main().catch(async (err) => {
  console.error(err.message || err);
  await disconnectPrisma();
  process.exit(1);
});
