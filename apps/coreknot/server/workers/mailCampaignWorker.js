const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('../utils/logger');
const { getRedisUrl } = require('../utils/wslRedis');
const { QUEUE_NAME, JOB_CAMPAIGN_SEND, closeMailCampaignQueue } = require('../services/mailCampaignQueue');
const { processCampaignBatch } = require('../services/mailCampaignBatch');

let worker = null;
let workerConnection = null;

const initMailCampaignWorker = () => {
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    logger.warn('mailCampaignWorker', 'REDIS_URL unset — mail campaign worker not started');
    return null;
  }

  workerConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
  });

  workerConnection.on('error', (err) => {
    logger.warn('mailCampaignWorker', 'Redis error', { error: err.message });
  });

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== JOB_CAMPAIGN_SEND) {
        logger.warn('mailCampaignWorker', `Unknown job name: ${job.name}`);
        return;
      }

      const { campaignId, batchIndex = 0, batchSize, tenantId } = job.data || {};
      if (!campaignId) {
        throw new Error('campaignId required');
      }

      logger.info('mailCampaignWorker', `Processing campaign.send batch ${batchIndex} for ${campaignId}`);

      const result = await processCampaignBatch({
        campaignId,
        batchIndex,
        batchSize,
        tenantId,
      });

      if (result.hasMore && !result.stopped) {
        const { enqueueCampaignBatch } = require('../services/mailCampaignQueue');
        await enqueueCampaignBatch({
          campaignId: String(campaignId),
          batchIndex: batchIndex + 1,
          tenantId,
        });
      }

      logger.info('mailCampaignWorker', `Batch ${batchIndex} done for ${campaignId}`, {
        processed: result.processed,
        hasMore: result.hasMore,
        stopped: result.stopped,
      });

      return result;
    },
    {
      connection: workerConnection,
      concurrency: 1,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error('mailCampaignWorker', `Job ${job?.id} failed`, { error: err.message });
  });

  worker.on('error', (err) => {
    logger.error('mailCampaignWorker', 'Worker error', { error: err.message });
  });

  logger.info('mailCampaignWorker', `BullMQ worker listening on ${QUEUE_NAME}`);
  return worker;
};

async function closeMailCampaignWorker() {
  if (worker) {
    await worker.close().catch(() => {});
    worker = null;
  }
  if (workerConnection) {
    try {
      workerConnection.disconnect();
    } catch (e) {
      /* ignore */
    }
    workerConnection = null;
  }
  await closeMailCampaignQueue();
}

module.exports = { initMailCampaignWorker, closeMailCampaignWorker };
