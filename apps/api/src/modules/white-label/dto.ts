import type { z } from 'zod';
import type { WhiteLabelTenantCreateSchema } from '@tsc/contracts';

export type WhiteLabelTenantCreateInput = z.infer<typeof WhiteLabelTenantCreateSchema>;
