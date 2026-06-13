import type { z } from 'zod';
import type {
  RelationshipCreateSchema,
  RelationshipGraphQuerySchema,
  RelationshipListQuerySchema,
  RelationshipUpdateSchema,
} from '@tsc/contracts';

export type RelationshipCreateInput = z.infer<typeof RelationshipCreateSchema>;
export type RelationshipUpdateInput = z.infer<typeof RelationshipUpdateSchema>;
export type RelationshipListQuery = z.infer<typeof RelationshipListQuerySchema>;
export type RelationshipGraphQuery = z.infer<typeof RelationshipGraphQuerySchema>;
