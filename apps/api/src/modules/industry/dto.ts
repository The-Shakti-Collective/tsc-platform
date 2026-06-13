import type { z } from 'zod';
import type {
  AgencyCreateSchema,
  AgencyListQuerySchema,
  AgencyUpdateSchema,
  BrandCreateOpportunitySchema,
  BrandCreateSchema,
  BrandListQuerySchema,
  BrandUpdateSchema,
  LabelCreateSchema,
  LabelListQuerySchema,
  LabelSigningStubSchema,
  LabelUpdateSchema,
} from '@tsc/contracts/industry/schemas';

export type BrandListQuery = z.infer<typeof BrandListQuerySchema>;
export type BrandCreateInput = z.infer<typeof BrandCreateSchema>;
export type BrandUpdateInput = z.infer<typeof BrandUpdateSchema>;
export type BrandCreateOpportunityInput = z.infer<typeof BrandCreateOpportunitySchema>;

export type AgencyListQuery = z.infer<typeof AgencyListQuerySchema>;
export type AgencyCreateInput = z.infer<typeof AgencyCreateSchema>;
export type AgencyUpdateInput = z.infer<typeof AgencyUpdateSchema>;

export type LabelListQuery = z.infer<typeof LabelListQuerySchema>;
export type LabelCreateInput = z.infer<typeof LabelCreateSchema>;
export type LabelUpdateInput = z.infer<typeof LabelUpdateSchema>;
export type LabelSigningStubInput = z.infer<typeof LabelSigningStubSchema>;
