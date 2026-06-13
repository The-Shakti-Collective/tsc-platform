import { BadRequestException } from '@nestjs/common';
import type { ZodTypeAny, output } from 'zod';

export function parseSchema<S extends ZodTypeAny>(
  schema: S,
  value: unknown,
): output<S> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.flatten());
  }
  return parsed.data;
}
