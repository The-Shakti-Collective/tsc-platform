const CalendarEvent = require('../models/CalendarEvent');
const { createLegacyRepository } = require('./createLegacyRepository');

const calendarRepository = createLegacyRepository({
  MongoModel: CalendarEvent,
  entityType: 'CalendarEvent',
  flagName: 'COREKNOT_CALENDAR_STORE',
});

module.exports = calendarRepository;
