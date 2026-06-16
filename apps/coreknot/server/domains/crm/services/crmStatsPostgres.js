const leadRepository = require('../../../repositories/leadRepository');
const { warmPipelineQuery } = require('../../../utils/crmPipelineFilters');

function matchesWarmPipeline(lead) {
  const warm = warmPipelineQuery();
  return Object.entries(warm).every(([key, value]) => lead[key] === value);
}

function computeLeadMetrics(leads) {
  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => l.leadStatus === 'Converted').length;
  const warmLeads = leads.filter(matchesWarmPipeline).length;
  const activeReach = leads.filter((l) => l.meaningfulConnect === 'YES').length;
  const connected = leads.filter((l) => l.callStatus === 'Connected').length;
  const repIds = new Set(
    leads.map((l) => (l.assignedRepId ? String(l.assignedRepId) : null)).filter(Boolean),
  );
  const conversionRate = totalLeads > 0
    ? Number(((convertedLeads / totalLeads) * 100).toFixed(1))
    : 0;

  return {
    totalLeads,
    activeReach,
    meaningful: activeReach,
    convertedLeads,
    converted: convertedLeads,
    warmLeads,
    conversionRate,
    connected,
    totalReps: repIds.size,
  };
}

async function computeStatsFromFilter(filter = {}) {
  const leads = await leadRepository.find(filter).lean();
  return computeLeadMetrics(leads);
}

async function computeRepSummary() {
  const leads = await leadRepository.find({}).lean();
  const byRep = new Map();

  for (const lead of leads) {
    const repId = lead.assignedRepId ? String(lead.assignedRepId) : 'unassigned';
    const entry = byRep.get(repId) || {
      id: repId === 'unassigned' ? null : repId,
      name: lead.assignedRep?.name || 'Unassigned',
      count: 0,
      conv: 0,
    };
    entry.count += 1;
    if (lead.leadStatus === 'Converted') entry.conv += 1;
    byRep.set(repId, entry);
  }

  const reps = [...byRep.values()]
    .map((row) => ({
      ...row,
      rate: row.count > 0 ? (row.conv / row.count) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const totalCount = reps.reduce((sum, row) => sum + (row.count || 0), 0);
  const totalConv = reps.reduce((sum, row) => sum + (row.conv || 0), 0);
  const avgConversion = totalCount > 0 ? Math.round((totalConv / totalCount) * 10) / 10 : 0;

  return { reps, avgConversion };
}

module.exports = {
  computeLeadMetrics,
  computeStatsFromFilter,
  computeRepSummary,
};
