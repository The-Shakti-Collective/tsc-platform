const LeaveRequest = require('../models/LeaveRequest');
const { createLegacyRepository } = require('./createLegacyRepository');

const leaveRequestRepository = createLegacyRepository({
  MongoModel: LeaveRequest,
  entityType: 'LeaveRequest',
  flagName: 'COREKNOT_ATTENDANCE_STORE',
});

module.exports = leaveRequestRepository;
