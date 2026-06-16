const { createLegacyRepository } = require('./createLegacyRepository');
const leadRepository = require('./leadRepository');

const CRM_FLAG = 'COREKNOT_CRM_STORE';

function createLazyLegacyRepository(modelPath, entityType) {
  let repo = null;
  const getRepo = () => {
    if (!repo) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const MongoModel = require(modelPath);
      repo = createLegacyRepository({ MongoModel, entityType, flagName: CRM_FLAG });
    }
    return repo;
  };

  return {
    entityType,
    flagName: CRM_FLAG,
    isPostgresEnabled: () => getRepo().isPostgresEnabled(),
    find: (...args) => getRepo().find(...args),
    findOne: (...args) => getRepo().findOne(...args),
    findById: (...args) => getRepo().findById(...args),
    countDocuments: (...args) => getRepo().countDocuments(...args),
    create: (...args) => getRepo().create(...args),
    insertMany: (...args) => getRepo().insertMany(...args),
    findOneAndUpdate: (...args) => getRepo().findOneAndUpdate(...args),
    findByIdAndUpdate: (...args) => getRepo().findByIdAndUpdate(...args),
    updateOne: (...args) => getRepo().updateOne(...args),
    deleteOne: (...args) => getRepo().deleteOne(...args),
    deleteMany: (...args) => getRepo().deleteMany(...args),
    findByIdAndDelete: (...args) => getRepo().findByIdAndDelete(...args),
    findOneAndDelete: (...args) => getRepo().findOneAndDelete(...args),
    mirrorToPostgres: (...args) => getRepo().mirrorToPostgres(...args),
    mongoRepo: new Proxy({}, {
      get(_target, prop) {
        return getRepo().mongoRepo[prop];
      },
    }),
  };
}

const crmConfigRepository = createLazyLegacyRepository(
  '../domains/crm/models/CRMConfig',
  'CRMConfig',
);
const crmImportRepository = createLazyLegacyRepository(
  '../domains/crm/models/CRMImport',
  'CRMImport',
);
const crmStatSnapshotRepository = createLazyLegacyRepository(
  '../domains/crm/models/CRMStatSnapshot',
  'CRMStatSnapshot',
);
const emiRepository = createLazyLegacyRepository(
  '../domains/crm/models/EMI',
  'EMI',
);
const crmAuditRepository = createLazyLegacyRepository(
  '../domains/crm/models/CRMAudit',
  'CRMAudit',
);

module.exports = {
  CRM_FLAG,
  leadRepository,
  crmConfigRepository,
  crmImportRepository,
  crmStatSnapshotRepository,
  emiRepository,
  crmAuditRepository,
};
