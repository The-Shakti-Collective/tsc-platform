import { z } from 'zod';

export const ContractTemplateTypeSchema = z.enum([
  'brand_deal',
  'performance',
  'workshop',
  'community',
]);

export const ContractStatusSchema = z.enum(['draft', 'sent', 'signed', 'cancelled']);

export const ContractListQuerySchema = z.object({
  artistId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  dealId: z.string().min(1).optional(),
  status: ContractStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const ContractCreateSchema = z.object({
  templateId: z.string().min(1).optional(),
  templateSlug: z.string().min(1).optional(),
  dealId: z.string().min(1).optional(),
  bookingRequestId: z.string().min(1).optional(),
  artistId: z.string().min(1),
  brandId: z.string().min(1).optional(),
  variables: z.record(z.unknown()).optional().default({}),
});

export const ContractSignSchema = z.object({
  documentUrl: z.string().url().optional(),
});
