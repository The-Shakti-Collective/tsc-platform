const { runWithContext, getTenantId } = require('./tenantContext');
const { listTenantIds } = require('../repositories/tenantRepository');

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Run a worker/cron callback with explicit tenant AsyncLocalStorage context.
 */
const runWithWorkerTenant = (tenantId, fn) =>
  runWithContext(
    {
      tenantId,
      userId: null,
      traceId: `worker-${Date.now()}`,
    },
    fn,
  );

/** All tenant ids — for per-tenant worker iteration before second org goes live. */
const getAllTenantIds = async () => listTenantIds();

const runForEachTenant = async (fn) => {
  const ids = await getAllTenantIds();
  for (const tenantId of ids) {
    await runWithWorkerTenant(tenantId, () => fn(tenantId));
  }
};

module.exports = {
  getTenantId,
  runWithWorkerTenant,
  runForEachTenant,
  getAllTenantIds,
  isProduction,
};
