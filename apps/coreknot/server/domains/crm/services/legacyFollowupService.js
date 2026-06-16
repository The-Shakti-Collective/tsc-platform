const { leadRepository } = require('../repositories');
const paginatedQuery = require('../../../utils/paginatedQuery');
const { applyCrmScopeToQuery } = require('../../../utils/crmScope');
const { isPostgresCrmEnabled } = require('../../../infrastructure/postgres/prismaClient');

class FollowupService {
  /**
   * Retrieves paginated followups using the CQRS separation logic.
   */
  static async getPaginatedFollowups(user, queryParams = {}) {
    const query = { nextFollowupDate: { $exists: true, $ne: '' } };
    applyCrmScopeToQuery(query, user, queryParams);

    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 50;

    let result;
    if (isPostgresCrmEnabled()) {
      const { leads, total } = await leadRepository.findPostgresLeadsPaginated(query, {
        page,
        limit,
        sortField: 'nextFollowupDate',
        sortOrder: 'asc',
      });
      result = {
        data: leads,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } else {
      result = await paginatedQuery(leadRepository, query, {
        page,
        limit,
        sort: { nextFollowupDate: 1 },
        populate: { path: 'assignedRepId', select: 'name avatar' },
      });
    }

    const followups = result.data.map((l) => ({
      ...l,
      date: l.nextFollowupDate,
      time: l.nextFollowupTime,
      status: l.callStatus === 'Connected' || l.leadStatus === 'Converted' ? 'Completed' : 'Pending',
      assignedRep: l.assignedRepId,
    }));

    return {
      data: followups,
      pagination: result.pagination,
    };
  }
}

module.exports = FollowupService;
