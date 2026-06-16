const { leadRepository } = require('../repositories');
const { broadcastRealtimeEvent } = require('../../../config/realtime');

const LOCK_HEARTBEAT_MS = 60 * 1000;

async function releaseLeadLock(leadId, userId) {
  const lead = await leadRepository.findById(leadId).select('lockedBy').lean();
  if (!lead) return { error: 'Lead not found', status: 404 };
  if (lead.lockedBy && lead.lockedBy !== userId) {
    return { error: 'Lock held by another user', status: 409 };
  }
  await leadRepository.findByIdAndUpdate(leadId, { $unset: { lockedBy: 1, lockedAt: 1 } });
  broadcastRealtimeEvent('leads', 'lead_unlock', { leadId });
  return { success: true };
}

async function heartbeatLeadLock(leadId, userId) {
  const lockDuration = new Date(Date.now() - LOCK_HEARTBEAT_MS);
  const lead = await leadRepository.findOneAndUpdate(
    {
      _id: leadId,
      $or: [
        { lockedBy: { $exists: false } },
        { lockedBy: null },
        { lockedBy: userId.toString() },
        { lockedAt: { $lt: lockDuration } },
      ],
    },
    { $set: { lockedAt: new Date() } },
    { new: true },
  ).select('lockedBy lockedAt');
  if (!lead) {
    return { error: 'Lock not held or expired', status: 409 };
  }
  return { success: true, lockedAt: lead.lockedAt };
}

module.exports = {
  LOCK_HEARTBEAT_MS,
  releaseLeadLock,
  heartbeatLeadLock,
};
