import { oid } from './lib/mongo.mjs';
import { mapDepartmentRole } from './lib/mappings.mjs';
import {
  clerkPlaceholderId,
  normalizeEmail,
  normalizePhone,
  toDate,
} from './lib/utils.mjs';

/**
 * @param {{ users: import('mongodb').Document[], departments: import('mongodb').Document[] }} input
 */
export function transformUsers(input) {
  const deptById = new Map(
    input.departments.map((d) => [oid(d), d]),
  );

  return input.users
    .map((u) => {
      const externalId = oid(u);
      const email = normalizeEmail(u.email);
      if (!externalId || !email) return null;

      const dept = u.departmentId ? deptById.get(String(u.departmentId)) : null;
      const platformRole = mapDepartmentRole(dept?.permissionPreset);

      return {
        externalId,
        tenantId: u.tenantId ? String(u.tenantId) : null,
        person: {
          name: String(u.name || email.split('@')[0]).trim(),
          email,
          phone: normalizePhone(u.phone),
          metadata: {
            legacyMongoUserId: externalId,
            repId: u.repId ?? null,
            gamification: {
              exp: u.exp ?? 0,
              level: u.level ?? 1,
              dailyStreak: u.dailyStreak ?? 0,
            },
          },
        },
        identity: {
          displayName: String(u.name || '').trim() || null,
          avatarUrl: u.avatar ?? null,
          metadata: {
            gender: u.gender ?? null,
            dateOfBirth: u.dateOfBirth ? toDate(u.dateOfBirth)?.toISOString() : null,
            pagePermissions: u.pagePermissions ?? [],
            presence: {
              lastOnline: u.lastOnline ? toDate(u.lastOnline)?.toISOString() : null,
              online: u.online ?? false,
            },
            pushSubscriptions: u.pushSubscriptions ?? [],
            googleId: u.googleId ?? null,
          },
        },
        user: {
          clerkUserId: clerkPlaceholderId(externalId),
          platformRole,
        },
        member: {
          role: platformRole,
          status: 'active',
        },
        teams: Array.isArray(u.teams) ? u.teams.map(String) : [],
        createdAt: toDate(u.createdAt),
        updatedAt: toDate(u.updatedAt) ?? toDate(u.createdAt),
      };
    })
    .filter(Boolean);
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { extractUsers } = await import('./extract-users.mjs');
  const raw = await extractUsers();
  console.log(JSON.stringify(transformUsers(raw), null, 2));
  process.exit(0);
}
