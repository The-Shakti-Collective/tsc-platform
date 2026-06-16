const express = require('express');
const router = express.Router();
const calendarRepository = require('../repositories/calendarRepository');
const taskRepository = require('../repositories/taskRepository');
const taskAssignmentRepository = require('../repositories/taskAssignmentRepository');
const leadRepository = require('../repositories/leadRepository');
const { protect } = require('../middleware/authMiddleware');
const { startOfDay, endOfDay } = require('date-fns');
const { getAllowedCategoriesForUser } = require('../utils/notificationCategories');
const { getVapidPublicKey } = require('../services/pushNotificationService');
const { prunePushSubscriptions } = require('../utils/pushSubscriptions');
const TaskService = require('../services/TaskService');
const logger = require('../utils/logger');
const { validateBody } = require('../validation/validateBody');
const { pushSubscribeBody, pushUnsubscribeBody } = require('../validation/schemas/notifications');
const { preferRepository } = require('../utils/preferPostgresStore');
const {
  isPostgresTasksEnabled,
  isPostgresCrmEnabled,
  isPostgresAuthEnabled,
} = require('../infrastructure/postgres/prismaClient');
const {
  findStaffUserById,
  findStaffUserPopulated,
  updateStaffUserMongo,
} = require('../repositories/staffUserRepository');
const { canUseMongoModels } = require('../services/mongoConnectionService');
const User = require('../models/User');

async function getAssignedTaskIds(userId) {
  if (preferRepository(isPostgresTasksEnabled)) {
    return taskAssignmentRepository.distinctTaskIdsForUser(userId);
  }
  return taskAssignmentRepository.distinct('taskId', { userId });
}

async function countTasks(filter) {
  if (preferRepository(isPostgresTasksEnabled)) {
    return taskRepository.countDocuments(filter);
  }
  const Task = require('../models/Task');
  return Task.countDocuments(filter);
}

router.get('/status-counts', protect, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const assignedTaskIds = await getAssignedTaskIds(req.user._id);
    const taskScope = assignedTaskIds.length ? { _id: { $in: assignedTaskIds } } : { _id: null };

    const overdueTasksCount = await countTasks({
      ...taskScope,
      status: { $ne: 'done' },
      dueDate: { $lt: now },
    });

    const todayTasksCount = await countTasks({
      ...taskScope,
      status: { $ne: 'done' },
      dueDate: { $gte: todayStart, $lte: todayEnd },
    });

    let overdueFollowupsCount = 0;
    let todayFollowupsCount = 0;

    if (preferRepository(isPostgresCrmEnabled)) {
      const leads = await leadRepository.find({
        assignedRepId: req.user._id,
        leadStatus: { $ne: 'Converted' },
      }).lean();
      for (const lead of leads) {
        if (!lead.nextFollowupDate) continue;
        const followupDate = new Date(lead.nextFollowupDate);
        if (Number.isNaN(followupDate.getTime())) continue;
        if (followupDate < todayStart) overdueFollowupsCount += 1;
        else if (followupDate >= todayStart && followupDate <= todayEnd) todayFollowupsCount += 1;
      }
    } else if (canUseMongoModels()) {
      const Lead = require('../models/Lead');
      const { aggregateWithTenant } = require('../repositories/aggregateWithTenant');
      const [followupAgg] = await aggregateWithTenant(Lead, [
        {
          $match: {
            assignedRepId: req.user._id,
            leadStatus: { $ne: 'Converted' },
            nextFollowupDate: { $exists: true, $ne: '' },
          },
        },
        {
          $addFields: {
            followupDate: {
              $dateFromString: {
                dateString: '$nextFollowupDate',
                onError: null,
                onNull: null,
              },
            },
          },
        },
        { $match: { followupDate: { $ne: null } } },
        {
          $group: {
            _id: null,
            today: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$followupDate', todayStart] }, { $lte: ['$followupDate', todayEnd] }] },
                  1,
                  0,
                ],
              },
            },
            overdue: {
              $sum: {
                $cond: [{ $lt: ['$followupDate', todayStart] }, 1, 0],
              },
            },
          },
        },
      ]);
      overdueFollowupsCount = followupAgg?.overdue || 0;
      todayFollowupsCount = followupAgg?.today || 0;
    }

    const todayCalendarCount = await calendarRepository.countDocuments({
      $or: [{ createdBy: req.user._id }, { visibility: 'public' }],
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const inReviewTasksCount = await countTasks({
      ...taskScope,
      status: 'in-review',
    });

    let reviewPendingCount = 0;
    try {
      const reviewQueue = await TaskService.getReviewQueue(req.user);
      reviewPendingCount = reviewQueue.length;
    } catch (reviewErr) {
      logger.warn('status-counts review queue', reviewErr?.message);
    }

    const allowed = await getAllowedCategoriesForUser(req.user);

    res.json({
      tasks: { overdue: overdueTasksCount, today: todayTasksCount, inReview: inReviewTasksCount },
      followups: { overdue: overdueFollowupsCount, today: todayFollowupsCount },
      calendar: { today: todayCalendarCount },
      notifications: { unread: 0, byCategory: {}, localOnly: true, allowedCategories: ['all', ...allowed] },
      review: { pending: reviewPendingCount },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status counts' });
  }
});

router.get('/push/vapid-key', protect, (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

router.post('/push/subscribe', protect, validateBody(pushSubscribeBody), async (req, res) => {
  try {
    const { subscription } = req.body;
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    const newSub = {
      endpoint,
      keys: { p256dh, auth },
      userAgent: req.headers['user-agent'] || '',
      createdAt: new Date(),
    };

    if (isPostgresAuthEnabled() || !canUseMongoModels()) {
      const user = await findStaffUserById(req.user._id);
      const pruned = prunePushSubscriptions(user?.pushSubscriptions || [], newSub);
      const prismaUser = user;
      if (prismaUser) {
        prismaUser.pushSubscriptions = pruned;
        await updateStaffUserMongo(prismaUser);
      }
      return res.json({ success: true, subscriptionCount: pruned.length });
    }

    const user = await User.findById(req.user._id).select('pushSubscriptions');
    const pruned = prunePushSubscriptions(user?.pushSubscriptions || [], newSub);
    await User.findByIdAndUpdate(req.user._id, {
      $set: { pushSubscriptions: pruned },
    });

    res.json({ success: true, subscriptionCount: pruned.length });
  } catch (error) {
    logger.error('Push', 'Failed to save subscription', { error: error.message, userId: req.user?._id });
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

router.delete('/push/unsubscribe', protect, validateBody(pushUnsubscribeBody), async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (isPostgresAuthEnabled() || !canUseMongoModels()) {
      const user = await findStaffUserById(req.user._id);
      if (user?.pushSubscriptions?.length) {
        user.pushSubscriptions = user.pushSubscriptions.filter((sub) => sub.endpoint !== endpoint);
        await updateStaffUserMongo(user);
      }
      return res.json({ success: true });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushSubscriptions: { endpoint } },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const allowed = await getAllowedCategoriesForUser(req.user);
    const user = await findStaffUserPopulated(req.user._id);
    res.json({
      notifications: [],
      localOnly: true,
      allowedCategories: ['all', ...allowed],
      departmentSlug: user?.departmentId?.slug || '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  res.json({ _id: req.params.id, read: true, localOnly: true });
});

router.patch('/read-all', protect, async (req, res) => {
  res.json({ message: 'All notifications marked as read', localOnly: true });
});

router.delete('/', protect, async (req, res) => {
  res.json({ message: 'Notifications cleared', deletedCount: 0, localOnly: true });
});

module.exports = router;
