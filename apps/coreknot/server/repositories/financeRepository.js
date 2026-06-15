const FinanceDocument = require('../models/FinanceDocument');
const { createLegacyRepository } = require('./createLegacyRepository');

const financeRepository = createLegacyRepository({
  MongoModel: FinanceDocument,
  entityType: 'FinanceDocument',
  flagName: 'COREKNOT_FINANCE_STORE',
});

module.exports = financeRepository;
