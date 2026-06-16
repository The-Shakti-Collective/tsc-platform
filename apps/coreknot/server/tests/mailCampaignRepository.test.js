const { applyMongoUpdate, ensureRecipientIds } = require('../repositories/createCampaignRepository');

describe('createCampaignRepository helpers', () => {
  it('assigns recipient ids when missing', () => {
    const rows = ensureRecipientIds([{ email: 'a@test.com' }]);
    expect(rows[0]._id).toMatch(/^[0-9a-fA-F]{24}$/);
  });

  it('applies array filter updates to matching recipients', () => {
    const doc = {
      _id: 'abc',
      recipients: [
        { _id: 'r1', status: 'Pending', email: 'a@test.com' },
        { _id: 'r2', status: 'Pending', email: 'b@test.com' },
      ],
    };
    const next = applyMongoUpdate(
      doc,
      { $set: { 'recipients.$[elem].status': 'Queued' } },
      [{ 'elem._id': { $in: ['r1'] }, 'elem.status': 'Pending' }],
    );
    expect(next.recipients[0].status).toBe('Queued');
    expect(next.recipients[1].status).toBe('Pending');
  });

  it('increments nested metrics counters', () => {
    const doc = { metrics: { opened: 2 } };
    const next = applyMongoUpdate(doc, { $inc: { 'metrics.opened': 1 } });
    expect(next.metrics.opened).toBe(3);
  });
});

describe('mail repositories export', () => {
  it('exports campaign and mail campaign repos', () => {
    const { campaignRepository, mailCampaignRepository, MAIL_FLAG } = require('../repositories/mailRepositories');
    expect(MAIL_FLAG).toBe('COREKNOT_MAIL_STORE');
    expect(typeof campaignRepository.create).toBe('function');
    expect(typeof mailCampaignRepository.aggregate).toBe('function');
    expect(typeof campaignRepository.isPostgresEnabled).toBe('function');
  });
});
