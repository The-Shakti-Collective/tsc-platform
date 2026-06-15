import { z } from 'zod';

const orgId = z.string().min(1);

export const InquiryCreateSchema = z.object({
  organizationId: orgId,
  subject: z.string().min(1),
  body: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  artistId: z.string().optional(),
  assignedPersonId: z.string().optional(),
});

export const InquiryListQuerySchema = z.object({
  organizationId: orgId,
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type InquiryCreateInput = z.infer<typeof InquiryCreateSchema>;
