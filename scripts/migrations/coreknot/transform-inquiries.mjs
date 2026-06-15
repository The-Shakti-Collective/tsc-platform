import { oid } from './lib/mongo.mjs';
import { mapInquiryStatus } from './lib/mappings.mjs';
import { normalizeEmail, normalizePhone, toDate } from './lib/utils.mjs';

/**
 * @param {import('mongodb').Document[]} inquiries
 */
export function transformInquiries(inquiries) {
  return inquiries.map((i) => {
    const externalId = oid(i);
    const { status, legacy } = mapInquiryStatus(i.status);
    const subject = i.eventName
      ? `Inquiry: ${i.eventName}`
      : `Inquiry from ${i.clientName || 'client'}`;

    return {
      externalId,
      organizationId: i.tenantId ? String(i.tenantId) : null,
      artistId: i.artistId ? String(i.artistId) : null,
      subject,
      body: i.metadata?.notes ?? null,
      status,
      contactName: i.clientName ?? null,
      contactEmail: normalizeEmail(i.email),
      assignedUserId: i.assignedManagerId ? String(i.assignedManagerId) : null,
      metadata: {
        phone: normalizePhone(i.phone),
        eventDate: i.eventDate ? toDate(i.eventDate)?.toISOString() : null,
        budget: i.expectedBudget ?? 0,
        source: i.source ?? 'manual',
        leadId: i.leadId ? String(i.leadId) : null,
        taskId: i.taskId ? String(i.taskId) : null,
        deadReason: i.deadReason ?? null,
        assignedManagerName: i.assignedManagerName ?? null,
        legacyStatus: legacy ?? i.status ?? null,
        ...(typeof i.metadata === 'object' && i.metadata ? i.metadata : {}),
      },
      createdAt: toDate(i.createdAt),
      updatedAt: toDate(i.updatedAt) ?? toDate(i.createdAt),
    };
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { extractInquiries } = await import('./extract-inquiries.mjs');
  const raw = await extractInquiries();
  console.log(JSON.stringify(transformInquiries(raw), null, 2));
  process.exit(0);
}
