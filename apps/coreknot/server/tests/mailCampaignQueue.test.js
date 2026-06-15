const {
  buildJobId,
  JOB_CAMPAIGN_SEND,
  QUEUE_NAME,
  getBatchSize,
} = require('../services/mailCampaignQueue');

describe('mailCampaignQueue', () => {
  it('exports stable queue name and job type', () => {
    expect(QUEUE_NAME).toBe('coreknot.mail');
    expect(JOB_CAMPAIGN_SEND).toBe('campaign.send');
  });

  it('builds deterministic idempotency keys per batch', () => {
    const campaignId = '507f1f77bcf86cd799439011';
    expect(buildJobId(campaignId, 0)).toBe(`coreknot:mail:${campaignId}:batch:0`);
    expect(buildJobId(campaignId, 3)).toBe(`coreknot:mail:${campaignId}:batch:3`);
  });

  it('defaults batch size to 100', () => {
    const prev = process.env.MAIL_CAMPAIGN_BATCH_SIZE;
    delete process.env.MAIL_CAMPAIGN_BATCH_SIZE;
    expect(getBatchSize()).toBe(100);
    process.env.MAIL_CAMPAIGN_BATCH_SIZE = '50';
    expect(getBatchSize()).toBe(50);
    if (prev === undefined) delete process.env.MAIL_CAMPAIGN_BATCH_SIZE;
    else process.env.MAIL_CAMPAIGN_BATCH_SIZE = prev;
  });
});

describe('dispatchCampaignJobs enqueue (mocked)', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns async queued payload when BullMQ enqueue succeeds', async () => {
    jest.doMock('../services/mailCampaignQueue', () => ({
      isMailQueueAvailable: () => true,
      enqueueCampaignBatch: jest.fn().mockResolvedValue({ jobId: 'coreknot:mail:abc:batch:0' }),
      cancelCampaignJobs: jest.fn(),
    }));

    jest.doMock('../utils/resolveCampaign', () => ({
      resolveCampaignByParam: jest.fn().mockResolvedValue({
        campaign: {
          _id: 'abc',
          status: 'Draft',
          tenantId: 'tenant-1',
          createdBy: 'user-1',
        },
        isLegacy: false,
        Model: {
          updateOne: jest.fn().mockReturnValue({ setOptions: jest.fn().mockResolvedValue({}) }),
        },
      }),
    }));

    jest.doMock('../utils/resolveCampaignTenantId', () => ({
      resolveCampaignTenantId: jest.fn().mockResolvedValue('tenant-1'),
    }));

    jest.doMock('../services/mailCampaignBatch', () => ({
      countPendingRecipients: jest.fn().mockResolvedValue(250),
      markInvalidPendingRecipients: jest.fn().mockResolvedValue(undefined),
      markCampaignFailed: jest.fn(),
      processCampaignBatch: jest.fn(),
    }));

    const { dispatchCampaignJobs } = require('../services/queueService');
    const result = await dispatchCampaignJobs('abc');

    expect(result.success).toBe(true);
    expect(result.async).toBe(true);
    expect(result.queuedCount).toBe(250);
    expect(result.jobId).toBe('coreknot:mail:abc:batch:0');
    expect(result.status).toBe('Queued');
  });
});
