/**
 * Assign admin department to a staff user in Postgres auth store (local/dev).
 * Usage: node scripts/assignStaffAdminPostgres.js <email>
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { ADMIN_SLUG } = require('../utils/departmentPermissions');

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: node scripts/assignStaffAdminPostgres.js <email>');
    process.exit(1);
  }

  if (process.env.COREKNOT_AUTH_STORE !== 'postgres') {
    console.warn('COREKNOT_AUTH_STORE is not postgres — auth may still read Mongo.');
  }

  const { PrismaClient } = await import('@tsc/database/client');
  const prisma = new PrismaClient();

  try {
    const user = await prisma.ckLegacyStaffUser.findUnique({
      where: { email },
      include: { department: true },
    });

    if (!user) {
      console.error(`User not found in ck_legacy_staff_users: ${email}`);
      process.exit(1);
    }

    let adminDept = await prisma.ckLegacyDepartment.findFirst({
      where: { tenantId: user.tenantId, slug: ADMIN_SLUG },
    });

    if (!adminDept) {
      adminDept = await prisma.ckLegacyDepartment.create({
        data: {
          id: user.tenantId.replace(/^(.{12}).*/, '$1admin000001').slice(0, 24) || `admin-${user.tenantId.slice(0, 8)}`,
          tenantId: user.tenantId,
          name: 'Admin',
          slug: ADMIN_SLUG,
          permissionPreset: 'admin',
          pagePermissions: [],
        },
      });
      console.log(`Created admin department: ${adminDept.id}`);
    }

    const updated = await prisma.ckLegacyStaffUser.update({
      where: { email },
      data: {
        departmentId: adminDept.id,
        pagePermissions: [],
      },
      include: { department: true },
    });

    console.log(`Assigned admin to ${updated.name} <${updated.email}>`);
    console.log(`  department: ${updated.department?.name} (${updated.department?.slug})`);
    console.log(`  preset: ${updated.department?.permissionPreset}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
