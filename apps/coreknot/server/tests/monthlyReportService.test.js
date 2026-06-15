const { buildTaskSummary } = require('../services/monthlyReportService');
const { applyTimeframeFilter } = require('../../shared/monthlyReportTimeframe');

describe('monthlyReportService task summary', () => {
  const startDate = new Date('2026-05-01T00:00:00.000Z');
  const endDate = new Date('2026-05-31T23:59:59.999Z');

  test('counts done tasks by completedAt within month', () => {
    const summary = buildTaskSummary([
      {
        title: 'Ship feature',
        status: 'done',
        completedAt: new Date('2026-05-15T10:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        title: 'Old done',
        status: 'done',
        completedAt: new Date('2026-04-01T10:00:00.000Z'),
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
      {
        title: 'Open',
        status: 'todo',
        dueDate: new Date('2026-05-20T00:00:00.000Z'),
        createdAt: new Date('2026-05-02T00:00:00.000Z'),
      },
    ], startDate, endDate);

    expect(summary.completed).toBe(1);
    expect(summary.monthActivity.filter((t) => t.status === 'done')).toHaveLength(1);
  });

  test('applyTimeframeFilter recounts completed tasks in custom window', () => {
    const report = {
      month: '2026-05',
      attendance: { byDay: [], present: 0, halfDay: 0, leave: 0, empty: 0, chart: [] },
      tasks: {
        completed: 2,
        inProgress: 0,
        todo: 0,
        inReview: 0,
        overdue: 0,
        monthActivity: [
          { title: 'A', status: 'done', date: '2026-05-28' },
          { title: 'B', status: 'done', date: '2026-05-01' },
          { title: 'C', status: 'done', date: '2026-04-20' },
        ],
      },
      logs: { byDay: [], entries: [], totalEntries: 0, totalHours: 0 },
      calendar: { events: [] },
    };

    const filtered = applyTimeframeFilter(report, {
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });
    expect(filtered.tasks.completed).toBe(2);
  });
});
