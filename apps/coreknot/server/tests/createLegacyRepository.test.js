const Attendance = require('../models/Attendance');

describe('createLegacyRepository date range filters', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = {
      ...env,
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/tsc_community',
      COREKNOT_POSTGRES_ENABLED: 'true',
      COREKNOT_ATTENDANCE_STORE: 'postgres',
    };
    jest.resetModules();
  });

  afterAll(() => {
    process.env = env;
  });

  it('does not treat date range as complex mongo filter', () => {
    const { createLegacyRepository } = require('../repositories/createLegacyRepository');
    const repo = createLegacyRepository({
      MongoModel: Attendance,
      entityType: 'Attendance',
      flagName: 'COREKNOT_ATTENDANCE_STORE',
    });

    const findSpy = jest.spyOn(repo.mongoRepo, 'find').mockReturnValue({
      lean: () => Promise.resolve([]),
      select: function select() { return this; },
      populate: function populate() { return this; },
      sort: function sort() { return this; },
      skip: function skip() { return this; },
      limit: function limit() { return this; },
      session: function session() { return this; },
    });

    repo.find({ date: { $gte: new Date('2026-06-01'), $lte: new Date('2026-06-07') } });
    expect(findSpy).not.toHaveBeenCalled();
    findSpy.mockRestore();
  });
});
