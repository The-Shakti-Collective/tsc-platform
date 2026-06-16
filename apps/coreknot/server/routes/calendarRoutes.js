const express = require('express');
const router = express.Router();
const { protect, requirePageAccess } = require('../middleware/authMiddleware');
const { isAdminUser } = require('../utils/departmentPermissions');
const calendarRepository = require('../repositories/calendarRepository');
const projectRepository = require('../repositories/projectRepository');
const taskRepository = require('../repositories/taskRepository');
const { seedMusicContentCalendar } = require('../services/musicCalendarSeedService');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Project = require('../models/Project');
const User = require('../models/User');
const { isMongoReady } = require('../services/mongoConnectionService');
const {
  isPostgresProjectsEnabled,
  isPostgresTasksEnabled,
  isPostgresCalendarEnabled,
  getPrismaClient,
} = require('../infrastructure/postgres/prismaClient');
const { resolvePersonId, resolveMongoId } = require('../infrastructure/postgres/syncMappingHelper');

const preferRepository = (storeEnabled) => storeEnabled() || !isMongoReady();
const { dispatchEmailPayload } = require('../services/mailDriver');
const GamificationService = require('../services/gamificationService');
const { validateCalendarEventRange, buildDateTimeFromParts, toDateKey } = require('../utils/dateValidation');
const { validateQuery } = require('../validation/validateQuery');
const { validateBody } = require('../validation/validateBody');
const { calendarQuery, calendarEventBody } = require('../validation/schemas/calendar');

function normalizeMeetingLink(link) {
  if (!link || typeof link !== 'string') return '';
  const trimmed = link.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

const calendarPage = requirePageAccess('calendar');

router.use(protect);
router.use(calendarPage);

async function getUserProjectIds(userId) {
  if (preferRepository(isPostgresProjectsEnabled)) {
    const projects = await projectRepository.find({
      $or: [{ members: userId }],
    }).select('_id').lean();
    return projects.map((p) => p._id);
  }
  const projects = await Project.find({ members: userId }).select('_id').lean();
  return projects.map((p) => p._id);
}

async function getAssignedTaskIds(userId) {
  if (preferRepository(isPostgresTasksEnabled)) {
    const prisma = await getPrismaClient();
    const personId = await resolvePersonId(String(userId));
    if (!personId) return [];
    const rows = await prisma.taskAssignee.findMany({
      where: { personId },
      select: { taskId: true },
    });
    const taskIds = await Promise.all(rows.map((row) => resolveMongoId('Task', row.taskId)));
    return taskIds.filter(Boolean);
  }
  const rows = await TaskAssignment.find({ userId }).select('taskId').lean();
  return rows.map((r) => r.taskId);
}

function eventOverlapsRange(ev, startDate, endDate) {
  const evStart = ev.date ? new Date(ev.date) : null;
  if (!evStart) return false;
  const evEnd = ev.endDate ? new Date(ev.endDate) : evStart;
  return evEnd >= startDate && evStart <= endDate;
}

function eventVisibleToUser(ev, userId, userProjectIds) {
  if (ev.visibility === 'public') return true;
  const createdBy = ev.createdBy?._id || ev.createdBy;
  if (String(createdBy) === String(userId)) return true;
  if (ev.visibility === 'project' && ev.projectId) {
    const pid = String(ev.projectId?._id || ev.projectId);
    return userProjectIds.some((id) => String(id) === pid);
  }
  return false;
}

async function fetchVisibleCalendarEvents(userId, userProjectIds, startDate, endDate) {
  if (preferRepository(isPostgresCalendarEnabled)) {
    const allEvents = await calendarRepository.find({}).lean();
    return allEvents.filter(
      (ev) => eventOverlapsRange(ev, startDate, endDate) && eventVisibleToUser(ev, userId, userProjectIds),
    );
  }

  const eventQuery = {
    $and: [
      {
        $or: [
          { visibility: 'public' },
          { createdBy: userId },
          ...(userProjectIds.length
            ? [{ visibility: 'project', projectId: { $in: userProjectIds } }]
            : []),
        ],
      },
      {
        $or: [
          { endDate: { $gte: startDate }, date: { $lte: endDate } },
          { endDate: null, date: { $gte: startDate, $lte: endDate } },
          { endDate: { $exists: false }, date: { $gte: startDate, $lte: endDate } },
        ],
      },
    ],
  };

  return calendarRepository.find(eventQuery, { bypass: true })
    .populate('createdBy', 'name avatar')
    .populate('projectId', 'name workspace')
    .lean();
}

function taskInDueDateRange(task, startDate, endDate) {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  return due >= startDate && due <= endDate;
}

async function fetchCalendarTasks(userId, assignedTaskIds, startDate, endDate) {
  const taskOr = [
    { createdBy: userId },
    { mentionAccessIds: userId },
  ];
  if (assignedTaskIds.length) {
    taskOr.push({ _id: { $in: assignedTaskIds } });
  }

  if (preferRepository(isPostgresTasksEnabled)) {
    const rows = await taskRepository.find({
      status: { $ne: 'done' },
      $or: taskOr,
    }).lean();
    return rows.filter((t) => taskInDueDateRange(t, startDate, endDate));
  }

  const taskQuery = {
    dueDate: { $gte: startDate, $lte: endDate, $ne: null },
    status: { $ne: 'done' },
    $or: taskOr,
  };
  return Task.find(taskQuery).populate('createdBy', 'name avatar').lean();
}

// GET /api/calendar — fetch all events visible to current user
router.get('/', validateQuery(calendarQuery), async (req, res) => {
  try {
    const now = new Date();
    const startDate = req.query.start ? new Date(req.query.start) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.end ? new Date(req.query.end) : new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const userProjectIds = await getUserProjectIds(req.user._id);
    const events = await fetchVisibleCalendarEvents(req.user._id, userProjectIds, startDate, endDate);

    const calendarOnly = events.map((ev) => ({
      ...ev,
      type: 'event',
      dueDate: ev.date,
      endDate: ev.endDate || ev.date,
    }));

    const assignedTaskIds = await getAssignedTaskIds(req.user._id);
    const tasks = await fetchCalendarTasks(req.user._id, assignedTaskIds, startDate, endDate);

    const taskEvents = tasks.map((t) => {
      const dateKey = toDateKey(t.dueDate);
      const atNine = dateKey ? buildDateTimeFromParts(dateKey, '09:00') : t.dueDate;
      return {
        _id: t._id,
        title: `[Task] ${t.title}`,
        description: t.description || '',
        date: atNine,
        dueDate: atNine,
        visibility: 'private',
        createdBy: t.createdBy,
        type: 'task',
        eventType: 'event',
        status: t.status,
        priority: t.priority,
        projectId: t.projectId,
      };
    });

    const combined = [...calendarOnly, ...taskEvents].sort((a, b) => new Date(a.date || a.dueDate) - new Date(b.date || b.dueDate));
    res.json(combined);
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// POST /api/calendar/seed-music-content — admin: import Music Content Calendar birthdays
router.post('/seed-music-content', async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const year = req.body?.year ? Number(req.body.year) : new Date().getFullYear();
    const result = await seedMusicContentCalendar({
      year,
      dryRun: false,
      creatorUserId: req.user._id,
    });
    res.json({
      message: `Music Content Calendar seeded for ${year}`,
      ...result,
    });
  } catch (err) {
    console.error('Error seeding music calendar:', err);
    res.status(500).json({ error: err.message || 'Failed to seed music calendar' });
  }
});

// POST /api/calendar — create new calendar event
router.post('/', validateBody(calendarEventBody), async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      startDate,
      startTime,
      endDate: endDateInput,
      endTime,
      visibility,
      eventType,
      meetingLink,
      workspace,
      projectId,
    } = req.body;

    const dateOnly = startDate || date;
    const timeOnly = startTime || time || '09:00';

    if (!title || !dateOnly) {
      return res.status(400).json({ error: 'Title and start date are required' });
    }

    if (visibility === 'project' && !projectId) {
      return res.status(400).json({ error: 'Project is required for project-related visibility' });
    }

    const rangeCheck = validateCalendarEventRange({
      startDate: dateOnly,
      startTime: timeOnly,
      endDate: endDateInput || dateOnly,
      endTime: endTime || timeOnly,
    });
    if (!rangeCheck.ok) {
      return res.status(400).json({ error: rangeCheck.error });
    }
    const { start: eventDateTime, end: eventEndDateTime } = rangeCheck;

    const resolvedType = eventType || 'event';
    const event = await calendarRepository.create({
      title,
      description: description || '',
      date: eventDateTime,
      endDate: eventEndDateTime,
      eventType: resolvedType,
      meetingLink: resolvedType === 'meeting' ? normalizeMeetingLink(meetingLink) : '',
      visibility: visibility || 'public',
      workspace: visibility === 'project' ? workspace || 'General' : '',
      projectId: visibility === 'project' ? projectId : null,
      createdBy: req.user._id,
    });

    const populated = await calendarRepository.findById(event._id)
      .populate('createdBy', 'name avatar')
      .populate('projectId', 'name workspace');

    const populatedObj = populated.toObject();
    populatedObj.type = 'event';

    if (visibility === 'public') {
      try {
        const allUsers = await User.find({ email: { $exists: true, $ne: '' } }, 'email name');
        const eventDate = eventDateTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const emailPromises = allUsers.map((user) =>
          dispatchEmailPayload({
            to: user.email,
            subject: `📅 New Public Event: ${title}`,
            html: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:28px;color:#cbd5e1;">
                <h2 style="color:#2dd4bf;margin:0 0 16px;font-size:20px;font-weight:600;">${title}</h2>
                <p style="margin:0 0 8px;line-height:1.6;"><strong style="color:#f8fafc;">Date:</strong> ${eventDate}</p>
                <p style="margin:0 0 8px;line-height:1.6;"><strong style="color:#f8fafc;">Created by:</strong> ${populated.createdBy.name}</p>
                ${description ? `<p style="margin:0 0 16px;line-height:1.6;"><strong style="color:#f8fafc;">Description:</strong> ${description}</p>` : ''}
                <p style="margin:0;">
                  <a href="${process.env.CLIENT_URL || 'https://coreknot.app'}/calendar"
                     style="background-color:#126d5e;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;">
                    View Event
                  </a>
                </p>
              </div>
            `,
            from: 'events@coreknot.io',
          }).catch((err) => console.error(`Failed to send event email to ${user.email}:`, err))
        );

        await Promise.all(emailPromises);
      } catch (emailErr) {
        console.error('Error sending public event emails:', emailErr);
      }
    }

    await GamificationService.awardActionXp(req.user._id, 'CALENDAR_EVENT_CREATED', {
      eventId: event._id,
      visibility: visibility || 'public',
    });

    res.status(201).json(populatedObj);
  } catch (err) {
    console.error('Error creating calendar event:', err);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// PUT /api/calendar/:id — update event (only owner)
router.put('/:id', validateBody(calendarEventBody), async (req, res) => {
  try {
    const event = await calendarRepository.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this event' });
    }

    const { title, description, date, time, startDate, startTime, endDate: endDateInput, endTime, visibility, eventType, meetingLink, workspace, projectId } = req.body;
    const dateOnly = startDate || date;
    const timeOnly = startTime || time;

    if (dateOnly) {
      const rangeCheck = validateCalendarEventRange({
        startDate: dateOnly,
        startTime: timeOnly || '09:00',
        endDate: endDateInput || dateOnly,
        endTime: endTime || timeOnly || '09:00',
      });
      if (!rangeCheck.ok) {
        return res.status(400).json({ error: rangeCheck.error });
      }
      event.date = rangeCheck.start;
      event.endDate = rangeCheck.end;
    }
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (eventType) event.eventType = eventType;
    const resolvedType = eventType || event.eventType;
    if (meetingLink !== undefined || (eventType && resolvedType !== 'meeting')) {
      event.meetingLink = resolvedType === 'meeting'
        ? normalizeMeetingLink(meetingLink)
        : '';
    }
    if (visibility) {
      event.visibility = visibility;
      if (visibility === 'project') {
        event.workspace = workspace || 'General';
        event.projectId = projectId || null;
      } else {
        event.workspace = '';
        event.projectId = null;
      }
    }

    await event.save();
    const populated = await calendarRepository.findById(event._id)
      .populate('createdBy', 'name avatar')
      .populate('projectId', 'name workspace');
    const populatedObj = populated.toObject();
    populatedObj.type = 'event';
    res.json(populatedObj);
  } catch (err) {
    console.error('Error updating calendar event:', err);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// DELETE /api/calendar/:id — delete event (only owner or admin)
router.delete('/:id', async (req, res) => {
  try {
    const event = await calendarRepository.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isOwner = event.createdBy.toString() === req.user._id.toString();
    const isAdmin = isAdminUser(req.user);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    await calendarRepository.deleteOne({ _id: req.params.id });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Error deleting calendar event:', err);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

module.exports = router;
