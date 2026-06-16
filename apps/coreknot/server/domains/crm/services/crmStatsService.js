const { applyCrmScopeToQuery, resolveCrmScope } = require('../../../utils/crmScope');
const { isPostgresCrmEnabled } = require('../../../infrastructure/postgres/prismaClient');
const { computeStatsFromFilter, computeRepSummary } = require('./crmStatsPostgres');

async function getCRMStats(user, queryParams = {}) {
  const scopeQuery = {};
  applyCrmScopeToQuery(scopeQuery, user, queryParams);
  const { restrictToOwn } = resolveCrmScope(user, queryParams.crmType);
  const matchStage = restrictToOwn && user?._id
    ? {
      ...scopeQuery,
      assignedRepId: scopeQuery.assignedRepId || user._id,
    }
    : { ...scopeQuery };

  if (isPostgresCrmEnabled()) {
    return computeStatsFromFilter(matchStage);
  }

  const { calculateStats } = require('../../../workers/statsWorker');
  return calculateStats(matchStage);
}

async function getRepSummary() {
  if (isPostgresCrmEnabled()) {
    return computeRepSummary();
  }

  const Lead = require('../models/Lead');
  const { aggregateWithTenant } = require('../../../repositories/aggregateWithTenant');
  const summary = await aggregateWithTenant(Lead, [
    {
      $group: {
        _id: '$assignedRepId',
        count: { $sum: 1 },
        conv: {
          $sum: {
            $cond: [{ $eq: ['$leadStatus', 'Converted'] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'rep',
      },
    },
    {
      $unwind: {
        path: '$rep',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        id: '$_id',
        name: { $ifNull: ['$rep.name', 'Unassigned'] },
        count: 1,
        conv: 1,
        rate: {
          $cond: [
            { $gt: ['$count', 0] },
            { $multiply: [{ $divide: ['$conv', '$count'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
  const totalCount = summary.reduce((s, r) => s + (r.count || 0), 0);
  const totalConv = summary.reduce((s, r) => s + (r.conv || 0), 0);
  const avgConversion =
    totalCount > 0 ? Math.round((totalConv / totalCount) * 10) / 10 : 0;
  return { reps: summary, avgConversion };
}

module.exports = {
  getCRMStats,
  getRepSummary,
};
