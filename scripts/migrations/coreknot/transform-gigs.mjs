import { oid } from './lib/mongo.mjs';
import { GIG_STATUS_FROM_PAYMENT } from './lib/mappings.mjs';
import { splitLocation, toDate } from './lib/utils.mjs';

/**
 * @param {import('mongodb').Document[]} gigs
 */
export function transformGigs(gigs) {
  return gigs.map((g) => {
    const externalId = oid(g);
    const { venue, city } = splitLocation(g.location);
    const paymentKey = String(g.paymentStatus || 'pending').toLowerCase();

    return {
      externalId,
      organizationId: g.tenantId ? String(g.tenantId) : null,
      artistId: g.artistId ? String(g.artistId) : null,
      title: String(g.name || 'Gig').trim(),
      venue,
      city,
      startsAt: toDate(g.gigDate) ?? new Date(),
      status: GIG_STATUS_FROM_PAYMENT[paymentKey] ?? 'tentative',
      fee: g.rate != null ? Number(g.rate) : null,
      currency: 'INR',
      notes: g.invoiceRef ?? null,
      metadata: {
        expense: g.expense ?? 0,
        paymentStatus: g.paymentStatus ?? 'pending',
        inquiryId: g.inquiryId ? String(g.inquiryId) : null,
        contractId: g.contractId ? String(g.contractId) : null,
        ...(typeof g.metadata === 'object' && g.metadata ? g.metadata : {}),
      },
      createdAt: toDate(g.createdAt),
      updatedAt: toDate(g.updatedAt) ?? toDate(g.createdAt),
    };
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { extractGigs } = await import('./extract-gigs.mjs');
  const raw = await extractGigs();
  console.log(JSON.stringify(transformGigs(raw), null, 2));
  process.exit(0);
}
