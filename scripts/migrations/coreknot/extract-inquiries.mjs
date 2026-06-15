import { fetchAll } from './lib/mongo.mjs';

export async function extractInquiries() {
  return fetchAll('artistinquiries');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const docs = await extractInquiries();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
