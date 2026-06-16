const {
  buildPrismaTaskWhere,
  matchDashboardTaskExpr,
  applyPostgresTaskFilters,
  legacyStatusesToPrisma,
} = require('../repositories/taskRepository');

describe('taskRepository prisma filters', () => {
  it('maps status $nin to Prisma notIn with deduped in_progress statuses', () => {
    const where = buildPrismaTaskWhere({ status: { $nin: ['done', 'in-review'] } });
    expect(where.status).toEqual({ notIn: ['done', 'in_progress'] });
  });

  it('dedupes in-progress and in-review to single in_progress in notIn', () => {
    const statuses = legacyStatusesToPrisma(['done', 'in-review', 'in-progress']);
    expect(statuses).toEqual(['done', 'in_progress']);
  });

  it('matches dashboard $expr scheduleDate/dueDate vs futureLimit', () => {
    const futureLimit = new Date('2026-07-01T00:00:00.000Z');
    const expr = {
      $let: {
        vars: { taskDay: { $ifNull: ['$scheduleDate', '$dueDate'] } },
        in: {
          $and: [
            { $ne: ['$$taskDay', null] },
            { $lt: ['$$taskDay', futureLimit] },
          ],
        },
      },
    };

    expect(matchDashboardTaskExpr({ scheduleDate: new Date('2026-06-15') }, expr)).toBe(true);
    expect(matchDashboardTaskExpr({ dueDate: new Date('2026-08-01') }, expr)).toBe(false);
    expect(matchDashboardTaskExpr({}, expr)).toBe(false);
  });

  it('applyPostgresTaskFilters honors $nin via pre-filtered list and $or access', () => {
    const tasks = [
      { _id: '1', status: 'todo', createdBy: 'u1', mentionAccessIds: [] },
      { _id: '2', status: 'done', createdBy: 'u2', mentionAccessIds: ['u3'] },
      { _id: '3', status: 'in-progress', createdBy: 'u2', mentionAccessIds: [] },
    ];
    const filtered = applyPostgresTaskFilters(tasks, {
      $or: [
        { createdBy: 'u1' },
        { mentionAccessIds: 'u3' },
      ],
    });
    expect(filtered.map((t) => t._id)).toEqual(['1', '2']);
  });
});
