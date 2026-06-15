import './env.mjs';
import { PrismaClient } from '@tsc/database/client';

/** @type {PrismaClient | null} */
let prisma = null;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Run a callback inside a transaction when executing; no-op wrapper on dry-run.
 * @param {import('@prisma/client').PrismaClient} client
 * @param {boolean} dryRun
 * @param {(tx: import('@prisma/client').Prisma.TransactionClient) => Promise<T>} fn
 * @template T
 */
export async function withTransaction(client, dryRun, fn) {
  if (dryRun) return fn(client);
  return client.$transaction(fn);
}
