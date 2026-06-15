const Person = require('../models/Person');
const { createLegacyRepository } = require('./createLegacyRepository');

const dataHubPersonRepository = createLegacyRepository({
  MongoModel: Person,
  entityType: 'DataHubPerson',
  flagName: 'COREKNOT_DATAHUB_STORE',
});

module.exports = dataHubPersonRepository;
