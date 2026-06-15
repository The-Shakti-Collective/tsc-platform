import { fetchAll } from './lib/mongo.mjs';

export async function extractGigs() {
  return fetchAll('artistgigs');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const docs = await extractGigs();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
