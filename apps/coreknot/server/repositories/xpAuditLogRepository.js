const XPAuditLog = require('../models/XPAuditLog');
const { createLegacyRepository } = require('./createLegacyRepository');

const xpAuditLogRepository = createLegacyRepository({
  MongoModel: XPAuditLog,
  entityType: 'XPAuditLog',
  flagName: 'COREKNOT_GAMIFICATION_STORE',
});

module.exports = xpAuditLogRepository;
