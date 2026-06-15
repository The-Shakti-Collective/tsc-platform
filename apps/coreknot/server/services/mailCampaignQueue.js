const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const { getRedisUrl, isRedisConfigured } = require('../utils/wslRedis');
const logger = require('../utils/logger');

const QUEUE_NAME = 'coreknot.mail';
const JOB_CAMPAIGN_SEND = 'campaign.send';

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_SEND_DELAY_MS = 150;

let connection = null;
let mailQueue = null;

function getBatchSize() {
  const raw = parseInt(process.env.MAIL_CAMPAIGN_BATCH_SIZE || '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_BATCH_SIZE;
}

function getSendDelayMs() {
  const raw = parseInt(process.env.MAIL_CAMPAIGN_SEND_DELAY_MS || '', 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_SEND_DELAY_MS;
}

function getConnection() {
  if (connection) return connection;
  const url = getRedisUrl();
  if (!url) return null;

  connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    connectTimeout: 5000,
    lazyConnect: true,
    retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
  });

  connection.on('error', (err) => {
    logger.warn('mailCampaignQueue', 'Redis connection error', { error: err.message });
  });

  return connection;
}

async function ensureQueueReady() {
  if (mailQueue) return mailQueue;
  if (!isRedisConfigured()) return null;

  const conn = getConnection();
  if (!conn) return null;

  try {
    if (conn.status !== 'ready') {
      await conn.connect();
    }
  } catch (err) {
    logger.warn('mailCampaignQueue', 'Redis connect failed', { error: err.message });
    return null;
  }

  mailQueue = new Queue(QUEUE_NAME, { connection: conn });
  return mailQueue;
}

function buildJobId(campaignId, batchIndex) {
  return `coreknot:mail:${String(campaignId)}:batch:${batchIndex}`;
}

/**
 * Enqueue first or subsequent batch for a campaign send.
 * @returns {Promise<{ jobId: string } | null>}
 */
async function enqueueCampaignBatch({ campaignId, batchIndex = 0, tenantId }) {
  const queue = await ensureQueueReady();
  if (!queue) return null;

  const jobId = buildJobId(campaignId, batchIndex);
  const job = await queue.add(
    JOB_CAMPAIGN_SEND,
    {
      campaignId: String(campaignId),
      batchIndex,
      batchSize: getBatchSize(),
      tenantId: tenantId ? String(tenantId) : undefined,
    },
    {
      jobId,
      removeOnComplete: { age: 86400, count: 500 },
      removeOnFail: { age: 604800, count: 200 },
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );

  return { jobId: job.id };
}

async function cancelCampaignJobs(campaignId) {
  const queue = await ensureQueueReady();
  if (!queue) return 0;

  const prefix = `coreknot:mail:${String(campaignId)}:batch:`;
  let removed = 0;
  const states = ['waiting', 'delayed', 'paused'];
  for (const state of states) {
    const jobs = await queue.getJobs(state, 0, 500);
    for (const job of jobs) {
      if (String(job.id || '').startsWith(prefix)) {
        await job.remove();
        removed += 1;
      }
    }
  }
  return removed;
}

async function closeMailCampaignQueue() {
  if (mailQueue) {
    await mailQueue.close().catch(() => {});
    mailQueue = null;
  }
  if (connection) {
    try {
      connection.disconnect();
    } catch (e) {
      /* ignore */
    }
    connection = null;
  }
}

function isMailQueueAvailable() {
  return isRedisConfigured();
}

module.exports = {
  QUEUE_NAME,
  JOB_CAMPAIGN_SEND,
  getBatchSize,
  getSendDelayMs,
  ensureQueueReady,
  enqueueCampaignBatch,
  cancelCampaignJobs,
  closeMailCampaignQueue,
  isMailQueueAvailable,
  buildJobId,
};
