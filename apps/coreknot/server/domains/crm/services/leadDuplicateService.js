const { leadRepository, crmAuditRepository } = require('../repositories');
const { isCorruptLeadPhone } = require('../../person/identity');
const { isQaTestRecord } = require('../../../services/qa/qaTestData');
const { bypassOptions } = require('../../../infrastructure/database/bypassTenantPolicy');

const BYPASS = bypassOptions('crm_duplicate_cleanup');

const ALLOWED_LEAD_FIELDS = [
  'name', 'nameKey', 'email', 'phone', 'city', 'webinarDates', 'attended', 'attendanceDurationMin',
  'meaningfulConnect', 'leadQuality', 'callStatus', 'leadStatus', 'remarks',
  'planOption', 'assignedRepId', 'rowId', 'customerIdExly', 'transactionIdExly',
  'exlyOfferingId', 'exlyOfferingTitle',
  'qnaAnswered', 'artistType', 'fullTimeWillingness', 'primaryRole',
  'learningGoal', 'learnedMusic', 'currentJourney', 'nextFollowupDate', 'nextFollowupTime',
  'emailStatus', 'tags', 'source', 'notes', 'setReminder',
  'crmType', 'artistProject', 'contactCategory',
];

/** Remove QA probe, corrupt phone, or overlong duplicate rows blocking real lead updates. */
async function clearBlockingDuplicateLead(duplicate) {
  if (!duplicate) return false;
  const row = duplicate.toObject ? duplicate.toObject() : duplicate;
  if (isCorruptLeadPhone(row.phone) || isQaTestRecord(row)) {
    await leadRepository.deleteOne({ _id: row._id }).setOptions(BYPASS);
    return true;
  }
  return false;
}

/** Merge non-empty fields from source into keeper, then delete source. */
async function mergeCorruptLeadIntoKeeper(keeperId, sourceLead, extraUpdates = {}) {
  const keeper = await leadRepository.findById(keeperId);
  if (!keeper) return null;

  const mergeFields = ALLOWED_LEAD_FIELDS.filter((f) => f !== 'phone' && f !== 'email');
  const patch = { ...extraUpdates };
  for (const field of mergeFields) {
    if (patch[field] !== undefined) continue;
    const srcVal = sourceLead[field];
    const keepVal = keeper[field];
    const empty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
    if (!empty(srcVal) && empty(keepVal)) patch[field] = srcVal;
  }

  if (Object.keys(patch).length) {
    await leadRepository.findByIdAndUpdate(keeperId, patch, BYPASS);
  }
  await crmAuditRepository.deleteMany({ leadId: sourceLead._id }).setOptions(BYPASS);
  await leadRepository.deleteOne({ _id: sourceLead._id }).setOptions(BYPASS);
  return leadRepository.findById(keeperId);
}

module.exports = {
  ALLOWED_LEAD_FIELDS,
  clearBlockingDuplicateLead,
  mergeCorruptLeadIntoKeeper,
};
