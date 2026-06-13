import { z } from 'zod';

export const GeneratedOpportunitySourceSchema = z.enum(['system', 'brand', 'community']);

export const GeneratedOpportunityStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'published',
  'dismissed',
]);

export const GeneratedOpportunityTypeSchema = z.enum([
  'showcase_event',
  'collaboration_open_call',
  'grant_opportunity',
]);

export const OpportunityGenerationRunInputSchema = z.object({
  scope: z
    .object({
      city: z.string().min(1).optional(),
      genre: z.string().min(1).optional(),
      cityLimit: z.coerce.number().int().min(1).max(30).optional().default(10),
      limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    })
    .optional()
    .default({}),
  triggeredBy: z.string().min(1).optional().default('admin'),
});

export const OpportunityGenerationDraftsQuerySchema = z.object({
  status: GeneratedOpportunityStatusSchema.optional().default('pending_approval'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  city: z.string().min(1).optional(),
  genre: z.string().min(1).optional(),
});

export const OpportunityGenerationSignalsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(15),
});

export const OpportunityGenerationApproveInputSchema = z.object({
  requireDecision: z.boolean().optional().default(false),
  deadlineDays: z.coerce.number().int().min(7).max(180).optional().default(45),
  value: z.coerce.number().min(0).optional(),
});

export type OpportunityGenerationRunInput = z.output<
  typeof OpportunityGenerationRunInputSchema
>;
export type OpportunityGenerationDraftsQuery = z.infer<
  typeof OpportunityGenerationDraftsQuerySchema
>;
export type OpportunityGenerationSignalsQuery = z.infer<
  typeof OpportunityGenerationSignalsQuerySchema
>;
export type OpportunityGenerationApproveInput = z.infer<
  typeof OpportunityGenerationApproveInputSchema
>;
