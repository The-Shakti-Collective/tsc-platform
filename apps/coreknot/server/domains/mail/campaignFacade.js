const { campaignRepository, mailCampaignRepository } = require('../../repositories/mailRepositories');
const { bypassOptions } = require('../../infrastructure/database/bypassTenantPolicy');

const BYPASS = bypassOptions('campaign_facade');
const isObjectIdHex = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const queryOpts = (options = {}) => ({
  bypass: true,
  ...options,
});

/**
 * Resolve a campaign by public campaignId or Mongo _id (same rules as GET /api/campaigns/:id).
 * Prefers campaignId match first to avoid collisions with 24-char hex ObjectIds.
 */
const resolveCampaignByParam = async (id, options = {}) => {
  if (!id || id === 'undefined' || id === 'null') return null;

  const key = String(id).trim();
  const { populate = false, lean = false, excludeRecipients = false } = options;
  const opts = queryOpts({ bypass: true });

  const loadOne = async (repo, filter, isLegacy = false) => {
    let query = repo.findOne(filter, opts);
    if (excludeRecipients) query = query.select('-recipients');
    if (lean) query = query.lean();
    else if (populate) query = query.populate('recipients.leadId').populate('senderProfileId').populate('senderProfileIds');
    const campaign = await query;
    if (!campaign) return null;
    return { campaign, isLegacy, Model: repo };
  };

  let resolved = await loadOne(campaignRepository, { campaignId: key });
  if (!resolved && isObjectIdHex(key)) {
    resolved = await loadOne(campaignRepository, { _id: key });
  }
  if (!resolved && isObjectIdHex(key)) {
    resolved = await loadOne(mailCampaignRepository, { _id: key }, true);
  }

  return resolved;
};

/**
 * Unified access for Campaign + MailCampaign without direct mongoose on postgres path.
 */
async function findByIdOrCampaignId(id, options = {}) {
  return resolveCampaignByParam(id, options);
}

async function findAllForUser(userId, { isAdmin = false } = {}) {
  const filter = isAdmin ? {} : { createdBy: userId };
  const opts = queryOpts({ bypass: true });
  const [mailCampaigns, coreCampaigns] = await Promise.all([
    mailCampaignRepository.find(filter, opts).sort('-createdAt').lean(),
    campaignRepository.find(filter, opts).sort('-createdAt').lean(),
  ]);
  return { mailCampaigns, coreCampaigns, all: [...mailCampaigns, ...coreCampaigns] };
}

async function deleteCampaign(resolved) {
  if (!resolved?.campaign) return false;
  const { campaign, Model } = resolved;
  await Model.findByIdAndDelete(campaign._id, queryOpts({ bypass: true }));
  return true;
}

module.exports = {
  campaignRepository,
  mailCampaignRepository,
  resolveCampaignByParam,
  isObjectIdHex,
  findByIdOrCampaignId,
  findAllForUser,
  deleteCampaign,
};
