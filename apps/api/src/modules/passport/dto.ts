import { z } from 'zod';
import { PassportEditSchema } from '@tsc/contracts/passport';

export { PassportEditSchema };

export type PassportEditInput = z.infer<typeof PassportEditSchema>;
