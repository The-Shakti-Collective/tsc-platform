const {
  PRESENT_MIN_HOURS,
  HALF_DAY_MIN_HOURS,
  resolveAttendanceDayStatus,
} = require('../../shared/attendanceDayStatus');
const { buildAttendanceSummary } = require('../services/monthlyReportService');

describe('attendanceDayStatus', () => {
  test('threshold constants', () => {
    expect(PRESENT_MIN_HOURS).toBe(5);
    expect(HALF_DAY_MIN_HOURS).toBe(4);
  });

  test('log hours drive present and half-day', () => {
    expect(resolveAttendanceDayStatus({ logHours: 6 })).toBe('present');
    expect(resolveAttendanceDayStatus({ logHours: 5 })).toBe('present');
    expect(resolveAttendanceDayStatus({ logHours: 4.5 })).toBe('halfDay');
    expect(resolveAttendanceDayStatus({ logHours: 4 })).toBe('halfDay');
    expect(resolveAttendanceDayStatus({ logHours: 3.9 })).toBe('empty');
  });

  test('check-in counts as present when logs are below half-day threshold', () => {
    expect(resolveAttendanceDayStatus({ logHours: 1, hasCheck: true })).toBe('present');
  });

  test('explicit leave without check-in or qualifying logs', () => {
    expect(resolveAttendanceDayStatus({ onLeave: true })).toBe('leave');
    expect(resolveAttendanceDayStatus({ onLeave: true, logHours: 6 })).toBe('present');
  });

  test('explicit half-day flag without logs', () => {
    expect(resolveAttendanceDayStatus({ isHalfDay: true })).toBe('halfDay');
  });
});

describe('buildAttendanceSummary', () => {
  test('merges log-only days into present/half-day counts', () => {
    const summary = buildAttendanceSummary([], [
      { date: '2026-05-10', hours: 6, count: 2 },
      { date: '2026-05-11', hours: 4.2, count: 1 },
      { date: '2026-05-12', hours: 2, count: 1 },
    ]);

    expect(summary.present).toBe(1);
    expect(summary.halfDay).toBe(1);
    expect(summary.empty).toBe(1);
    expect(summary.byDay).toHaveLength(3);
  });

  test('attendance row plus logs uses log-hours precedence', () => {
    const summary = buildAttendanceSummary([
      {
        date: new Date('2026-05-10T00:00:00.000Z'),
        onLeave: false,
        isHalfDay: false,
        inTimeRecord: { manualTimestamp: '09:00' },
        outTimeRecord: { manualTimestamp: '18:00' },
      },
    ], [
      { date: '2026-05-10', hours: 4.5, count: 1 },
    ]);

    expect(summary.halfDay).toBe(1);
    expect(summary.present).toBe(0);
  });
});
