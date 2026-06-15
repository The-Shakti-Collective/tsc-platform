const ExlyBooking = require('../models/ExlyBooking');
const { createLegacyRepository } = require('./createLegacyRepository');

const integrationsRepository = createLegacyRepository({
  MongoModel: ExlyBooking,
  entityType: 'ExlyBooking',
  flagName: 'COREKNOT_INTEGRATIONS_STORE',
});

module.exports = integrationsRepository;
