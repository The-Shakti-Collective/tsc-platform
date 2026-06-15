/**
 * Platform vs CoreKnot API boundary configuration.
 * @see docs/architecture/API-BOUNDARY.md
 */

export function isPlatformCoreknotCompatEnabled(): boolean {
  const flag = process.env.PLATFORM_COREKNOT_COMPAT_ENABLED?.trim().toLowerCase();
  if (flag === 'true' || flag === '1' || flag === 'yes') return true;
  if (flag === 'false' || flag === '0' || flag === 'no') return false;
  // Default off in production — compat routes are CoreKnot-client-only during migration.
  return process.env.NODE_ENV !== 'production';
}

/** CoreKnot ops modules still registered on Platform API (transitional). */
export const PLATFORM_COREKNOT_OPS_MODULES = [
  'CrmModule',
  'InquiriesModule',
  'ProjectModule',
  'TaskModule',
  'WorkspaceModule',
  'GigsModule',
  'InvoicesModule',
  'FinanceModule',
  'CalendarModule',
  'ReleasesModule',
  'RoyaltiesModule',
  'ContentModule',
  'DistributionModule',
  'IntegrationsModule',
  'AuditModule',
  'CoreknotCompatModule',
] as const;
