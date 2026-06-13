import type { Prisma } from '@tsc/database';

export function toInputJson(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return {};
  }
  return value as Prisma.InputJsonValue;
}
