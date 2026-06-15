import { fetchAll } from './lib/mongo.mjs';

export async function extractOrganizations() {
  return fetchAll('tenants');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const docs = await extractOrganizations();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
