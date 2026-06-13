import type { z } from 'zod';
import type { ContractCreateSchema, ContractListQuerySchema } from './schema';

export type ContractListQuery = z.infer<typeof ContractListQuerySchema>;
export type ContractCreateInput = z.infer<typeof ContractCreateSchema>;
