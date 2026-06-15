import { z } from 'zod';

export const AuditLogListQuerySchema = z.object({
  organizationId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const AuditLogCreateSchema = z.object({
  organizationId: z.string().optional(),
  actorPersonId: z.string().optional(),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  action: z.enum(['create', 'update', 'delete', 'status_change']),
  changes: z.record(z.unknown()).optional(),
});

export type AuditLogListQuery = z.output<typeof AuditLogListQuerySchema>;
export type RecordAuditLogInput = z.output<typeof AuditLogCreateSchema>;
