import { z } from "zod";

export const GraphEntityTypeSchema = z.enum([
  "Artist",
  "Venue",
  "Curator",
  "Brand",
  "Agency",
  "Label",
  "Organization",
  "Person",
  "Festival",
  "Event",
  "Community",
  "Membership",
]);

export const RelationshipTypeSchema = z.enum([
  "MANAGES",
  "COLLABORATED_WITH",
  "ATTENDED",
  "MEMBER_OF",
  "PERFORMED_AT",
  "BOOKED_BY",
  "FOLLOWS",
  "MENTORED_BY",
  "SPONSORED_BY",
  "WORKED_WITH",
  "REFERRED_BY",
  "SIGNED_TO",
  "SUPPORTED",
  "SUBSCRIBED",
  "PURCHASED",
  "REFERRED",
]);

/** Accept Phase 4 snake_case aliases and normalize to Phase 6 enum. */
export const RelationshipTypeInputSchema = z
  .string()
  .min(1)
  .transform((value, ctx) => {
    const upper = value.toUpperCase();
    const parsed = RelationshipTypeSchema.safeParse(upper);
    if (parsed.success) return parsed.data;

    const legacyMap: Record<string, z.infer<typeof RelationshipTypeSchema>> = {
      performed_at: "PERFORMED_AT",
      booked: "BOOKED_BY",
      worked_with: "WORKED_WITH",
      collaborated_with: "COLLABORATED_WITH",
      managed_by: "MANAGES",
      sponsored_by: "SPONSORED_BY",
      organized_by: "MANAGES",
      hosted_at: "PERFORMED_AT",
      represented_by: "MANAGES",
      affiliated_with: "MEMBER_OF",
      produced_by: "WORKED_WITH",
      featured_at: "PERFORMED_AT",
      follows: "FOLLOWS",
      attended: "ATTENDED",
      member_of: "MEMBER_OF",
      mentored_by: "MENTORED_BY",
      referred_by: "REFERRED_BY",
      signed_to: "SIGNED_TO",
      supported: "SUPPORTED",
      subscribed: "SUBSCRIBED",
      purchased: "PURCHASED",
      referred: "REFERRED",
    };

    const legacy = legacyMap[value.toLowerCase()];
    if (legacy) return legacy;

    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown relationship type: ${value}` });
    return z.NEVER;
  });

export const GraphPathQuerySchema = z.object({
  targetEntityType: GraphEntityTypeSchema,
  targetEntityId: z.string().min(1),
  maxDepth: z.coerce.number().int().min(1).max(6).optional().default(4),
});

export const RelationshipListQuerySchema = z.object({
  entityType: GraphEntityTypeSchema.optional(),
  entityId: z.string().min(1).optional(),
  relationshipType: RelationshipTypeInputSchema.optional(),
  includeInactive: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export const RelationshipGraphQuerySchema = z.object({
  depth: z.coerce.number().int().min(1).max(3).optional().default(1),
  relationshipType: RelationshipTypeInputSchema.optional(),
  includeInactive: z.coerce.boolean().optional().default(false),
});

export const RelationshipCreateSchema = z.object({
  sourceEntityType: GraphEntityTypeSchema,
  sourceEntityId: z.string().min(1),
  targetEntityType: GraphEntityTypeSchema,
  targetEntityId: z.string().min(1),
  relationshipType: RelationshipTypeInputSchema,
  strength: z.number().min(0).max(1).optional(),
  weight: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
});

export const RelationshipUpdateSchema = z.object({
  relationshipType: RelationshipTypeInputSchema.optional(),
  strength: z.number().min(0).max(1).nullable().optional(),
  weight: z.number().min(0).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  effectiveFrom: z.string().datetime().nullable().optional(),
  effectiveTo: z.string().datetime().nullable().optional(),
});

export const RelationshipEntityParamsSchema = z.object({
  entityType: GraphEntityTypeSchema,
  entityId: z.string().min(1),
});
