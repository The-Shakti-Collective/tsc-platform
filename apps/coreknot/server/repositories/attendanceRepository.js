const Attendance = require('../models/Attendance');
const { createLegacyRepository } = require('./createLegacyRepository');

const attendanceRepository = createLegacyRepository({
  MongoModel: Attendance,
  entityType: 'Attendance',
  flagName: 'COREKNOT_ATTENDANCE_STORE',
});

module.exports = attendanceRepository;
