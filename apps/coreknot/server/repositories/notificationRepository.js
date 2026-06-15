const Notification = require('../models/Notification');
const { createLegacyRepository } = require('./createLegacyRepository');

const notificationRepository = createLegacyRepository({
  MongoModel: Notification,
  entityType: 'Notification',
  flagName: 'COREKNOT_NOTIFICATIONS_STORE',
});

module.exports = notificationRepository;
