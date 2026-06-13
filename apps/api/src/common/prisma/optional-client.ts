import type { PrismaClient } from '@tsc/database/client';

/** Typed accessor for Prisma models that may be absent in generated client during schema drift. */
export function optionalPrismaClient<T>(client: PrismaClient, key: string): T | null {
  const record = client as unknown as Record<string, T | undefined>;
  return record[key] ?? null;
}
