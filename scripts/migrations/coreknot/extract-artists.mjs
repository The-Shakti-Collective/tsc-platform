import { fetchAll } from './lib/mongo.mjs';

export async function extractArtists() {
  return fetchAll('artists');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const docs = await extractArtists();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
