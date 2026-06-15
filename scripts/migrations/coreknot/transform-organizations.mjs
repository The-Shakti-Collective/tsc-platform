import { oid } from './lib/mongo.mjs';
import { defaultOrgSlug, toDate } from './lib/utils.mjs';

/**
 * @param {import('mongodb').Document[]} tenants
 */
export function transformOrganizations(tenants) {
  return tenants.map((t) => ({
    externalId: oid(t),
    name: String(t.name || 'Default Tenant').trim(),
    slug: defaultOrgSlug(t.name),
    metadata: {
      customDomain: t.domain ?? null,
      tenantStatus: t.status ?? 'trial',
      contactEmail: t.contactEmail ?? null,
      migratedFrom: 'tenants',
    },
    createdAt: toDate(t.createdAt),
    updatedAt: toDate(t.updatedAt) ?? toDate(t.createdAt),
  }));
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { extractOrganizations } = await import('./extract-organizations.mjs');
  const raw = await extractOrganizations();
  console.log(JSON.stringify(transformOrganizations(raw), null, 2));
  process.exit(0);
}
