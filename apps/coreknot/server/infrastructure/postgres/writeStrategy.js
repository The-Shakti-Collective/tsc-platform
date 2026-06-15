/**
 * Dual-write direction: Mongo-first (legacy) vs Postgres-first (cutover).
 */
const { isPostgresPrimaryCutover } = require('./migrationProfile');
const { isMongoRequired } = require('./prismaClient');

function shouldWritePostgresFirst(isDomainPostgresEnabled) {
  return (
    typeof isDomainPostgresEnabled === 'function'
    && isDomainPostgresEnabled()
    && isPostgresPrimaryCutover()
  );
}

function shouldMirrorMongo() {
  return isMongoRequired();
}

function newLegacyMongoId() {
  const mongoose = require('mongoose');
  return new mongoose.Types.ObjectId().toString();
}

function asMongoDoc(plain) {
  const id = plain._id ? String(plain._id) : newLegacyMongoId();
  const payload = { ...plain, _id: id };
  return {
    ...payload,
    _id: id,
    toObject() {
      const obj = { ...payload, _id: id };
      delete obj.toObject;
      return obj;
    },
  };
}

module.exports = {
  shouldWritePostgresFirst,
  shouldMirrorMongo,
  isPostgresPrimaryCutover,
  newLegacyMongoId,
  asMongoDoc,
};
