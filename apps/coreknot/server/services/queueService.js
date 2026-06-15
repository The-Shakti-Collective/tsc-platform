const Campaign = require('../models/Campaign');
const MailCampaign = require('../models/MailCampaign');
const logger = require('../utils/logger');
const { resolveCampaignByParam } = require('../utils/resolveCampaign');
const { bypassOptions } = require('../infrastructure/database/bypassTenantPolicy');
const { resolveCampaignTenantId } = require('../utils/resolveCampaignTenantId');

const BYPASS = bypassOptions('CAMPAIGN_DISPATCH');

const {
  isCampaignStopped,
  markCampaignStopped,
  clearCampaignStopped,
} = require('./campaignQueueState');
const { processEmailJob } = require('./emailProcessor');
const {
  processCampaignBatch,
  countPendingRecipients,
  markInvalidPendingRecipients,
  markCampaignFailed,
} = require('./mailCampaignBatch');
const {
  isMailQueueAvailable,
  enqueueCampaignBatch,
  cancelCampaignJobs,
} = require('./mailCampaignQueue');

const activeDispatchLoops = new Set();

const resetStuckQueuedRecipients = async (Model, campaignId) => {
  await Model.updateOne(
    { _id: campaignId },
    { $set: { 'recipients.$[elem].status': 'Pending' } },
    { arrayFilters: [{ 'elem.status': 'Queued' }], ...BYPASS },
  );
};

/** Dev/test fallback — batch loop in web process when Redis worker unavailable. */
const runCampaignDispatchLoop = async (campaignId, { batchIndex = 0, tenantId: tenantIdHint } = {}) => {
  const id = String(campaignId);
  if (activeDispatchLoops.has(id) && batchIndex === 0) return;
  if (batchIndex === 0) activeDispatchLoops.add(id);

  try {
    let batchIdx = batchIndex;
    let hasMore = true;

    while (hasMore) {
      if (isCampaignStopped(id)) break;

      const result = await processCampaignBatch({
        campaignId: id,
        batchIndex: batchIdx,
        tenantId: tenantIdHint,
      });

      hasMore = result.hasMore && !result.stopped;
      batchIdx += 1;

      if (hasMore) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }
  } catch (err) {
    logger.error('Queue Service', `Dispatch loop failed for campaign ${id}`, { error: err.message });
    try {
      const resolved = await resolveCampaignByParam(campaignId, { excludeRecipients: true });
      if (resolved) {
        await markCampaignFailed(resolved.Model, resolved.campaign._id, err.message);
      }
    } catch (markErr) {
      logger.warn('Queue Service', 'Failed to mark campaign failed', { error: markErr.message });
    }
  } finally {
    if (batchIndex === 0) activeDispatchLoops.delete(id);
  }
};

const stopCampaign = async (campaignId) => {
  const resolved = await resolveCampaignByParam(campaignId);
  if (!resolved) throw new Error('Campaign not found');

  const { campaign } = resolved;
  if (campaign.status !== 'Sending' && campaign.status !== 'Queued') {
    throw new Error(`Cannot stop campaign with status "${campaign.status}"`);
  }

  const id = campaign._id.toString();
  markCampaignStopped(id);

  let cancelledCount = 0;
  for (const rec of campaign.recipients || []) {
    if (rec.status === 'Pending' || rec.status === 'Queued') {
      rec.status = 'Cancelled';
      cancelledCount++;
    }
  }

  campaign.status = 'Stopped';
  campaign.stoppedAt = new Date();
  await campaign.save();

  const removedFromQueue = await cancelCampaignJobs(id);

  return {
    success: true,
    cancelledCount,
    removedFromQueue,
    stoppedAt: campaign.stoppedAt,
  };
};

const dispatchCampaignJobs = async (campaignId) => {
  const resolved = await resolveCampaignByParam(campaignId, { excludeRecipients: true });
  if (!resolved) throw new Error('Campaign not found');

  const { campaign, isLegacy, Model } = resolved;

  if (campaign.status === 'Stopped') {
    return { success: false, queuedCount: 0, message: 'Campaign is stopped', async: false };
  }

  if (!isLegacy && campaign.status === 'Draft') {
    return { success: false, queuedCount: 0, message: 'Campaign is a draft — dispatch explicitly to send', async: false };
  }

  await markInvalidPendingRecipients(Model, campaign._id);

  const pendingCount = await countPendingRecipients(Model, campaign._id);
  if (pendingCount === 0) {
    return { success: true, queuedCount: 0, message: 'All recipients are already processed or queued', async: false };
  }

  const tenantId = await resolveCampaignTenantId(campaign);
  if (!tenantId) {
    throw new Error(`Cannot dispatch campaign ${campaign._id} — no tenantId`);
  }

  if (!campaign.tenantId) {
    await Model.updateOne({ _id: campaign._id }, { $set: { tenantId } }).setOptions(BYPASS);
  }

  clearCampaignStopped(campaign._id.toString());

  const useBullMq = isMailQueueAvailable();
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && !useBullMq) {
    throw new Error(
      'REDIS_URL is required for mail campaign dispatch in production. Provision Redis and deploy the CoreKnot worker service.',
    );
  }

  await Model.updateOne(
    { _id: campaign._id },
    { $set: { status: 'Queued', queuedAt: new Date() } },
  ).setOptions(BYPASS);

  if (useBullMq) {
    const enqueued = await enqueueCampaignBatch({
      campaignId: campaign._id,
      batchIndex: 0,
      tenantId,
    });

    if (!enqueued) {
      if (isProd) {
        throw new Error('Failed to enqueue mail campaign job — check REDIS_URL and worker service.');
      }
      logger.warn('Queue Service', 'BullMQ enqueue failed — falling back to in-process batch dispatch');
    } else {
      return {
        success: true,
        queuedCount: pendingCount,
        message: 'Campaign queued — worker will send in batches',
        async: true,
        jobId: enqueued.jobId,
        status: 'Queued',
      };
    }
  } else {
    logger.warn(
      'Queue Service',
      'REDIS_URL unset — processing mail campaign in web process (dev only). Start workers: pnpm start:coreknot:workers',
    );
  }

  setImmediate(() => {
    runCampaignDispatchLoop(campaign._id, { tenantId }).catch((err) => {
      logger.error('Queue Service', 'In-process dispatch failed', { error: err.message });
    });
  });

  return {
    success: true,
    queuedCount: pendingCount,
    message: 'Dispatch started — emails send in background batches (in-process dev fallback)',
    async: true,
    status: 'Queued',
  };
};

const resumeStuckCampaigns = async () => {
  if (process.env.NODE_ENV === 'test') return { resumed: 0 };

  const { isMongoRequired } = require('../infrastructure/postgres/prismaClient');
  if (!isMongoRequired()) {
    logger.debug('Queue Service', 'resumeStuckCampaigns skipped — COREKNOT_MONGO_REQUIRED=false');
    return { resumed: 0 };
  }

  const filter = { status: { $in: ['Sending', 'Queued'] } };
  let resumed = 0;

  const resumeForModel = async (Model) => {
    const stuck = await Model.find(filter).select('_id title tenantId createdBy').lean();
    for (const camp of stuck) {
      const pending = await countPendingRecipients(Model, camp._id);
      if (pending > 0) {
        await resetStuckQueuedRecipients(Model, camp._id);
        logger.info('Queue Service', `Resuming stuck campaign dispatch: ${camp.title || camp._id}`);

        const tenantId = await resolveCampaignTenantId(camp);
        if (isMailQueueAvailable()) {
          await enqueueCampaignBatch({ campaignId: camp._id, batchIndex: 0, tenantId }).catch((err) => {
            logger.error('Queue Service', 'Resume enqueue failed', { error: err.message });
          });
        } else {
          runCampaignDispatchLoop(camp._id, { tenantId }).catch((err) => {
            logger.error('Queue Service', 'Resume dispatch failed', { error: err.message });
          });
        }
        resumed += 1;
      }
    }
  };

  await resumeForModel(Campaign);
  await resumeForModel(MailCampaign);

  return { resumed };
};

/** Wait for in-process dispatch loops (tests / graceful shutdown). */
const drainMemoryQueue = async (timeoutMs = 30000) => {
  const deadline = Date.now() + timeoutMs;
  while (activeDispatchLoops.size > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

module.exports = {
  dispatchCampaignJobs,
  stopCampaign,
  processEmailJob,
  drainMemoryQueue,
  isCampaignStopped,
  resumeStuckCampaigns,
  runCampaignDispatchLoop,
};
