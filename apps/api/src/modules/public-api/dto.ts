import type { z } from 'zod';
import type {
  ApiKeyCreateSchema,
  PublicArtistListQuerySchema,
  PublicCommunityListQuerySchema,
  PublicEventListQuerySchema,
  PublicOpportunityListQuerySchema,
  PublicPaginationQuerySchema,
  PublicVenueListQuerySchema,
} from '@tsc/contracts';

export type ApiKeyCreateInput = z.infer<typeof ApiKeyCreateSchema>;
export type PublicPaginationQuery = z.infer<typeof PublicPaginationQuerySchema>;
export type PublicArtistListQuery = z.infer<typeof PublicArtistListQuerySchema>;
export type PublicCommunityListQuery = z.infer<typeof PublicCommunityListQuerySchema>;
export type PublicOpportunityListQuery = z.infer<typeof PublicOpportunityListQuerySchema>;
export type PublicEventListQuery = z.infer<typeof PublicEventListQuerySchema>;
export type PublicVenueListQuery = z.infer<typeof PublicVenueListQuerySchema>;
