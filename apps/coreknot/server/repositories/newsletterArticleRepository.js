const NewsletterArticle = require('../models/NewsletterArticle');
const { createLegacyRepository } = require('./createLegacyRepository');

const newsletterArticleRepository = createLegacyRepository({
  MongoModel: NewsletterArticle,
  entityType: 'NewsletterArticle',
  flagName: 'COREKNOT_NEWSLETTER_STORE',
});

module.exports = newsletterArticleRepository;
