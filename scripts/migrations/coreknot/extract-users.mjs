import { fetchAll } from './lib/mongo.mjs';

export async function extractUsers() {
  const [users, departments] = await Promise.all([
    fetchAll('users'),
    fetchAll('departments'),
  ]);
  return { users, departments };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const docs = await extractUsers();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
