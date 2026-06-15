const NewsletterIssue = require('../models/NewsletterIssue');
const { createLegacyRepository } = require('./createLegacyRepository');

const newsletterRepository = createLegacyRepository({
  MongoModel: NewsletterIssue,
  entityType: 'NewsletterIssue',
  flagName: 'COREKNOT_NEWSLETTER_STORE',
});

module.exports = newsletterRepository;
