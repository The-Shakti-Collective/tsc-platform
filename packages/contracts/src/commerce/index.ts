import { z } from 'zod';

export const TicketCatalogQuerySchema = z.object({
  eventId: z.string().min(1).optional(),
});

export const MerchCatalogQuerySchema = z.object({
  artistId: z.string().min(1).optional(),
  communityId: z.string().min(1).optional(),
});

export const ExperienceCatalogQuerySchema = z.object({
  artistId: z.string().min(1).optional(),
});

export const FanPurchasesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type TicketCatalogQuery = z.infer<typeof TicketCatalogQuerySchema>;
export type MerchCatalogQuery = z.infer<typeof MerchCatalogQuerySchema>;
export type ExperienceCatalogQuery = z.infer<typeof ExperienceCatalogQuerySchema>;
export type FanPurchasesQuery = z.infer<typeof FanPurchasesQuerySchema>;
