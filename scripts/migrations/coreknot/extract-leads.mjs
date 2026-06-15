import { fetchAll } from './lib/mongo.mjs';

export async function extractLeads() {
  return fetchAll('leads');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const docs = await extractLeads();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
