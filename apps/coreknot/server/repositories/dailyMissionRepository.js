const DailyMission = require('../models/DailyMission');
const { createLegacyRepository } = require('./createLegacyRepository');

const dailyMissionRepository = createLegacyRepository({
  MongoModel: DailyMission,
  entityType: 'DailyMission',
  flagName: 'COREKNOT_GAMIFICATION_STORE',
});

module.exports = dailyMissionRepository;
