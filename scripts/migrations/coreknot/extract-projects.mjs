import { fetchAll, getMongoDb } from './lib/mongo.mjs';

export async function extractProjects() {
  const [projects, workspaces, users] = await Promise.all([
    fetchAll('projects'),
    fetchAll('workspaces'),
    fetchAll('users', {}, { projection: { _id: 1, email: 1 } }),
  ]);

  const db = await getMongoDb();
  const labelAgg = await db
    .collection('projects')
    .aggregate([
      { $group: { _id: '$workspace', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
    ])
    .toArray();

  return { projects, workspaces, workspaceLabels: labelAgg, users };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const docs = await extractProjects();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
