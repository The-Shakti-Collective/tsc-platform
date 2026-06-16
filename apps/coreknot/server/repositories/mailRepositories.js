const { createCampaignRepository } = require('./createCampaignRepository');

const MAIL_FLAG = 'COREKNOT_MAIL_STORE';

function createLazyCampaignRepository(modelPath, entityType) {
  let repo = null;
  const getRepo = () => {
    if (!repo) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const MongoModel = require(modelPath);
      repo = createCampaignRepository({ MongoModel, entityType, flagName: MAIL_FLAG });
    }
    return repo;
  };

  const proxyMethod = (name) => (...args) => getRepo()[name](...args);

  return {
    entityType,
    flagName: MAIL_FLAG,
    isPostgresEnabled: () => getRepo().isPostgresEnabled(),
    find: proxyMethod('find'),
    findOne: proxyMethod('findOne'),
    findById: proxyMethod('findById'),
    exists: proxyMethod('exists'),
    countDocuments: proxyMethod('countDocuments'),
    create: proxyMethod('create'),
    saveDocument: proxyMethod('saveDocument'),
    insertMany: proxyMethod('insertMany'),
    findOneAndUpdate: proxyMethod('findOneAndUpdate'),
    findByIdAndUpdate: proxyMethod('findByIdAndUpdate'),
    updateOne: proxyMethod('updateOne'),
    deleteOne: (...args) => getRepo().deleteMany(...args).then((r) => ({ deletedCount: r.deletedCount })),
    deleteMany: proxyMethod('deleteMany'),
    findByIdAndDelete: proxyMethod('findByIdAndDelete'),
    findOneAndDelete: proxyMethod('findByIdAndDelete'),
    aggregate: proxyMethod('aggregate'),
    mirrorToPostgres: proxyMethod('mirrorToPostgres'),
    mongoRepo: new Proxy({}, {
      get(_target, prop) {
        return getRepo().mongoRepo[prop];
      },
    }),
  };
}

const campaignRepository = createLazyCampaignRepository(
  '../domains/mail/models/Campaign',
  'Campaign',
);

const mailCampaignRepository = createLazyCampaignRepository(
  '../domains/mail/models/MailCampaign',
  'MailCampaign',
);

module.exports = {
  MAIL_FLAG,
  campaignRepository,
  mailCampaignRepository,
};
