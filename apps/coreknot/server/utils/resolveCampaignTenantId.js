const { bypassOptions } = require('../infrastructure/database/bypassTenantPolicy');
const { findDefaultTenant } = require('../repositories/tenantRepository');
const { findStaffUserById } = require('../repositories/staffUserRepository');

const BYPASS = bypassOptions('CAMPAIGN_TENANT_RESOLVE');

/**
 * Resolve tenant for campaign workers/webhooks when AsyncLocalStorage has no request context.
 */
async function resolveCampaignTenantId(campaign) {
  if (!campaign) return null;
  if (campaign.tenantId) {
    return campaign.tenantId._id || campaign.tenantId;
  }

  const createdBy = campaign.createdBy?._id || campaign.createdBy;
  if (createdBy) {
    const user = await findStaffUserById(createdBy, { select: 'tenantId' });
    if (user?.tenantId) return user.tenantId;
    const User = require('../models/User');
    const mongoUser = await User.findById(createdBy).select('tenantId').setOptions(BYPASS).lean();
    if (mongoUser?.tenantId) return mongoUser.tenantId;
  }

  const tenant = await findDefaultTenant();
  return tenant?._id ?? tenant?.id ?? null;
}

module.exports = { resolveCampaignTenantId };
