const { isPostgresTasksEnabled, isMongoRequired } = require('../infrastructure/postgres/prismaClient');
const { withTransactionRetry } = require('./mongoTransaction');

const OBJECT_ID_HEX = /^[a-f0-9]{24}$/i;
const CUID_HEX = /^c[a-z0-9]{24,}$/i;

function isValidEntityId(value) {
  return typeof value === 'string'
    && value.length > 0
    && value !== '[object Object]'
    && (OBJECT_ID_HEX.test(value) || CUID_HEX.test(value));
}

function usesMongoSessions() {
  return isMongoRequired() && !isPostgresTasksEnabled();
}

function getMongoose() {
  // eslint-disable-next-line global-require
  return require('mongoose');
}

async function withTaskSession(fn, { retry = true } = {}) {
  if (!usesMongoSessions()) {
    await fn(null);
    return;
  }
  const mongoose = getMongoose();
  const session = await mongoose.startSession();
  try {
    if (retry) {
      await withTransactionRetry(session, async () => fn(session));
    } else {
      await session.withTransaction(async () => fn(session));
    }
  } finally {
    session.endSession();
  }
}

module.exports = {
  isValidEntityId,
  usesMongoSessions,
  getMongoose,
  withTaskSession,
};
