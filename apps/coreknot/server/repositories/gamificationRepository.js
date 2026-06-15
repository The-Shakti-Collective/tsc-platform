const GamificationConfig = require('../models/GamificationConfig');
const { createLegacyRepository } = require('./createLegacyRepository');

const gamificationRepository = createLegacyRepository({
  MongoModel: GamificationConfig,
  entityType: 'GamificationConfig',
  flagName: 'COREKNOT_GAMIFICATION_STORE',
});

module.exports = gamificationRepository;
