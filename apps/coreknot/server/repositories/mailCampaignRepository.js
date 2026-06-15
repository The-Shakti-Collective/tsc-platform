const MailCampaign = require('../domains/mail/models/MailCampaign');
const { createLegacyRepository } = require('./createLegacyRepository');

const mailCampaignRepository = createLegacyRepository({
  MongoModel: MailCampaign,
  entityType: 'MailCampaign',
  flagName: 'COREKNOT_MAIL_STORE',
});

module.exports = mailCampaignRepository;
