import { fetchAll } from './lib/mongo.mjs';

export async function extractTasks() {
  const [tasks, assignments] = await Promise.all([
    fetchAll('tasks'),
    fetchAll('taskassignments'),
  ]);

  const assignmentsByTask = new Map();
  for (const a of assignments) {
    const taskId = String(a.taskId);
    if (!assignmentsByTask.has(taskId)) assignmentsByTask.set(taskId, []);
    assignmentsByTask.get(taskId).push(a);
  }

  return tasks.map((t) => ({
    ...t,
    _assignments: assignmentsByTask.get(String(t._id)) ?? [],
  }));
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const docs = await extractTasks();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
