import { z } from 'zod';

const orgId = z.string().min(1);

export const LeadCreateSchema = z.object({
  organizationId: orgId,
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  stage: z
    .enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'])
    .optional(),
  assignedPersonId: z.string().optional(),
  notes: z.string().optional(),
});

export const LeadListQuerySchema = z.object({
  organizationId: orgId,
  stage: z
    .enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;
