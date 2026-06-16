import type { TypesenseClient } from './client.js';
import type { CollectionSchema } from './collections.js';
import { COLLECTION_SCHEMAS } from './collections.js';

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const httpStatus = (error as { httpStatus?: number }).httpStatus;
  return httpStatus === 404;
}

export async function ensureCollection(
  client: TypesenseClient,
  schema: CollectionSchema,
): Promise<'created' | 'exists'> {
  try {
    await client.collections(schema.name).retrieve();
    return 'exists';
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
    await client.collections().create(schema as never);
    return 'created';
  }
}

export async function bootstrapCollections(client: TypesenseClient) {
  const results: Array<{ collection: string; status: 'created' | 'exists' }> = [];

  for (const schema of COLLECTION_SCHEMAS) {
    const status = await ensureCollection(client, schema);
    results.push({ collection: schema.name, status });
  }

  return results;
}

export async function recreateCollection(
  client: TypesenseClient,
  schema: CollectionSchema,
): Promise<'recreated'> {
  try {
    await client.collections(schema.name).delete();
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  await client.collections().create(schema as never);
  return 'recreated';
}

export async function recreateAllCollections(client: TypesenseClient) {
  const results: Array<{ collection: string; status: 'recreated' }> = [];

  for (const schema of COLLECTION_SCHEMAS) {
    const status = await recreateCollection(client, schema);
    results.push({ collection: schema.name, status });
  }

  return results;
}
