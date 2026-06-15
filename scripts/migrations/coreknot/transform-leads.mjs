import { oid } from './lib/mongo.mjs';
import { mapLeadStage } from './lib/mappings.mjs';
import {
  normalizeEmail,
  normalizePhone,
  notesFromLead,
  toDate,
} from './lib/utils.mjs';

/**
 * @param {import('mongodb').Document[]} leads
 */
export function transformLeads(leads) {
  return leads.map((l) => {
    const externalId = oid(l);
    const { stage, legacy } = mapLeadStage(l.leadStatus);

    const overflow = {
      personId: l.personId ? String(l.personId) : null,
      crmType: l.crmType ?? 'sales',
      rowId: l.rowId ?? null,
      tags: l.tags ?? [],
      emailStatus: l.emailStatus ?? null,
      bounceCount: l.bounceCount ?? 0,
      unsubscribed: l.unsubscribed ?? false,
      meaningfulConnect: l.meaningfulConnect ?? null,
      callStatus: l.callStatus ?? null,
      leadQuality: l.leadQuality ?? null,
      lock: l.lockedBy ? { lockedBy: l.lockedBy, lockedAt: l.lockedAt } : null,
      exly: {
        customerIdExly: l.customerIdExly ?? null,
        transactionIdExly: l.transactionIdExly ?? null,
        exlyOfferingId: l.exlyOfferingId ?? null,
        exlyOfferingTitle: l.exlyOfferingTitle ?? null,
        exlyOfferings: l.exlyOfferings ?? [],
      },
      ...(typeof l.metadata === 'object' && l.metadata ? l.metadata : {}),
    };
    if (legacy) overflow.legacyLeadStatus = legacy;

    return {
      externalId,
      organizationId: l.tenantId ? String(l.tenantId) : null,
      name: String(l.name || 'Unknown').trim(),
      email: normalizeEmail(l.email),
      phone: normalizePhone(l.phone),
      source: l.source ?? null,
      stage,
      assignedUserId: l.assignedRepId ? String(l.assignedRepId) : null,
      notes: notesFromLead(l),
      metadata: {
        city: l.city ?? null,
        ...overflow,
      },
      createdAt: toDate(l.createdAt),
      updatedAt: toDate(l.updatedAt) ?? toDate(l.createdAt),
    };
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { extractLeads } = await import('./extract-leads.mjs');
  const raw = await extractLeads();
  console.log(JSON.stringify(transformLeads(raw), null, 2));
  process.exit(0);
}
