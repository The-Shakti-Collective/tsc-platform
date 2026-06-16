const Log = require('../models/Log');
const { createLegacyRepository } = require('./createLegacyRepository');

const logRepository = createLegacyRepository({
  MongoModel: Log,
  entityType: 'Log',
  flagName: 'COREKNOT_GAMIFICATION_STORE',
});

module.exports = logRepository;
