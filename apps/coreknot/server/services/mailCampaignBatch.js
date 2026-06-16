const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { bypassOptions } = require('../infrastructure/database/bypassTenantPolicy');
const { resolveCampaignByParam } = require('../utils/resolveCampaign');
const { resolveCampaignTenantId } = require('../utils/resolveCampaignTenantId');
const { runWithWorkerTenant } = require('../utils/workerTenantContext');
const { isCampaignStopped } = require('../domains/mail/services/campaignQueueState');
const { processEmailJob } = require('../domains/mail/services/emailProcessor');
const { isValidEmail } = require('../utils/emailValidation');
const {
  getBatchSize,
  getSendDelayMs,
} = require('./mailCampaignQueue');

const BYPASS = bypassOptions('CAMPAIGN_DISPATCH');

const fetchPendingRecipientChunk = async (Model, campaignId, limit) =>
  Model.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(String(campaignId)) } },
    { $unwind: '$recipients' },
    { $match: { 'recipients.status': 'Pending' } },
    { $limit: limit },
    {
      $project: {
        recipientId: '$recipients._id',
        email: '$recipients.email',
        status: '$recipients.status',
      },
    },
  ]);

const markRecipientsQueued = async (Model, campaignId, recipientIds) => {
  if (!recipientIds.length) return;
  await Model.updateOne(
    { _id: campaignId },
    { $set: { 'recipients.$[elem].status': 'Queued' } },
    { arrayFilters: [{ 'elem._id': { $in: recipientIds }, 'elem.status': 'Pending' }], ...BYPASS },
  );
};

const markInvalidPendingRecipients = async (Model, campaignId) => {
  const rows = await Model.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(String(campaignId)) } },
    { $unwind: '$recipients' },
    { $match: { 'recipients.status': { $in: ['Pending', 'Queued'] } } },
    { $project: { _id: '$recipients._id', email: '$recipients.email' } },
  ]);
  const invalidIds = rows.filter((row) => !isValidEmail(row.email)).map((row) => row._id);
  if (!invalidIds.length) return;

  await Model.updateOne(
    { _id: campaignId },
    {
      $set: {
        'recipients.$[elem].status': 'Invalid',
        'recipients.$[elem].error': 'Invalid email address',
      },
    },
    {
      arrayFilters: [{ 'elem._id': { $in: invalidIds } }],
      ...BYPASS,
    },
  );
};

const countPendingRecipients = async (Model, campaignId) => {
  const rows = await Model.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(String(campaignId)) } },
    { $unwind: '$recipients' },
    { $match: { 'recipients.status': { $in: ['Pending', 'Queued'] } } },
    { $count: 'n' },
  ]);
  return rows[0]?.n || 0;
};

const markCampaignFailed = async (Model, campaignId, message) => {
  await Model.updateOne(
    { _id: campaignId },
    { $set: { status: 'Failed', lastError: message, failedAt: new Date() } },
    { ...BYPASS, bypass: true },
  );
};

const markCampaignSending = async (Model, campaignId) => {
  await Model.updateOne(
    { _id: campaignId },
    { $set: { status: 'Sending', queuedAt: undefined } },
    { ...BYPASS, bypass: true },
  );
};

const markCampaignCompletedIfDone = async (Model, campaignId) => {
  const pending = await countPendingRecipients(Model, campaignId);
  if (pending === 0) {
    await Model.updateOne(
      { _id: campaignId },
      { $set: { status: 'Completed', completedAt: new Date() } },
      { ...BYPASS, bypass: true },
    );
    return true;
  }
  return false;
};

/**
 * Process one paginated batch of pending recipients (never loads full recipient list).
 */
async function processCampaignBatch({ campaignId, batchIndex = 0, batchSize, tenantId: tenantIdHint }) {
  const id = String(campaignId);
  if (isCampaignStopped(id)) {
    return { processed: 0, hasMore: false, stopped: true };
  }

  const resolved = await resolveCampaignByParam(campaignId, { excludeRecipients: true });
  if (!resolved) {
    throw new Error(`Campaign not found: ${id}`);
  }

  const { campaign, isLegacy, Model } = resolved;
  const tenantId = tenantIdHint || (await resolveCampaignTenantId(campaign));
  if (!tenantId) {
    throw new Error(`Cannot dispatch campaign ${id} — no tenantId`);
  }

  const limit = batchSize || getBatchSize();
  const sendDelayMs = getSendDelayMs();

  return runWithWorkerTenant(tenantId, async () => {
    const freshStatus = await Model.findById(campaign._id, { bypass: true }).select('status').lean();
    if (!freshStatus || freshStatus.status === 'Stopped' || isCampaignStopped(id)) {
      return { processed: 0, hasMore: false, stopped: true };
    }

    if (batchIndex === 0 && freshStatus.status === 'Queued') {
      await markCampaignSending(Model, campaign._id);
    }

    await markInvalidPendingRecipients(Model, campaign._id);

    const meta = await Model.findById(campaign._id, { bypass: true })
      .select('status subject title content senderProfileId senderProfileIds senderMode signature includeSignature removeUnsubscribe variableMapping variableFallbacks mailTemplateId attachments campaignId systemProvider resendFromEmail')
      .populate('senderProfileId')
      .populate('senderProfileIds')
      .lean();

    if (!meta || meta.status === 'Stopped' || isCampaignStopped(id)) {
      return { processed: 0, hasMore: false, stopped: true };
    }

    const chunk = await fetchPendingRecipientChunk(Model, campaign._id, limit);
    if (!chunk.length) {
      await markCampaignCompletedIfDone(Model, campaign._id);
      return { processed: 0, hasMore: false, stopped: false };
    }

    const pendingIds = chunk
      .filter((row) => row.status === 'Pending')
      .map((row) => row.recipientId);
    if (pendingIds.length) {
      await markRecipientsQueued(Model, campaign._id, pendingIds);
    }

    let processed = 0;
    let failures = 0;

    for (let i = 0; i < chunk.length; i += 1) {
      const row = chunk[i];
      if (isCampaignStopped(id)) break;

      const jobData = {
        campaignId: id,
        recipientId: row.recipientId.toString(),
        email: row.email,
        subject: meta.subject || meta.title,
        content: meta.content,
        profileId: meta.senderProfileId
          ? (meta.senderProfileId._id || meta.senderProfileId).toString()
          : null,
        isLegacy,
        jobIndex: batchIndex * limit + i,
        tenantId,
      };

      try {
        await processEmailJob(jobData);
        processed += 1;
      } catch (err) {
        failures += 1;
        logger.error('mailCampaignBatch', `Send failed for ${row.email}`, { error: err.message, campaignId: id });
      }

      if (sendDelayMs > 0 && i < chunk.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, sendDelayMs));
      }
    }

    const stillPending = await countPendingRecipients(Model, campaign._id);
    const hasMore = stillPending > 0;

    if (!hasMore) {
      await markCampaignCompletedIfDone(Model, campaign._id);
      const { syncProviderUsageFromEvents } = require('./profileSendStats');
      syncProviderUsageFromEvents().catch((err) => {
        logger.warn('mailCampaignBatch', 'Post-dispatch usage sync failed', { error: err.message });
      });
    }

    return {
      processed,
      failures,
      hasMore,
      stopped: isCampaignStopped(id),
      batchIndex,
    };
  });
}

module.exports = {
  processCampaignBatch,
  countPendingRecipients,
  markInvalidPendingRecipients,
  markCampaignFailed,
  fetchPendingRecipientChunk,
};
