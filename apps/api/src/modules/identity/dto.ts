import type { z } from 'zod';
import type { MergeIdentitySchema, ResolveIdentitySchema } from './schema';

export type ResolveIdentityInput = z.infer<typeof ResolveIdentitySchema>;
export type MergeIdentityInput = z.infer<typeof MergeIdentitySchema>;
