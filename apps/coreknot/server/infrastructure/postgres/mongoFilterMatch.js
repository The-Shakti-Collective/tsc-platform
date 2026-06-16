/**
 * In-memory matcher for common Mongo-style filters used by CRM lead queries.
 */
function compareValues(a, b) {
  if (a == null && b == null) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return String(a) === String(b) || a === b;
}

function matchCondition(value, condition) {
  if (condition == null || typeof condition !== 'object' || Array.isArray(condition) || condition instanceof Date) {
    return compareValues(value, condition);
  }

  if (Object.prototype.hasOwnProperty.call(condition, '$in')) {
    return condition.$in.some((entry) => compareValues(value, entry));
  }
  if (Object.prototype.hasOwnProperty.call(condition, '$ne')) {
    return !compareValues(value, condition.$ne);
  }
  if (Object.prototype.hasOwnProperty.call(condition, '$exists')) {
    const exists = value != null && value !== '';
    return condition.$exists ? exists : !exists;
  }
  if (Object.prototype.hasOwnProperty.call(condition, '$regex')) {
    const re = new RegExp(condition.$regex, condition.$options || '');
    return re.test(String(value ?? ''));
  }
  if (Object.prototype.hasOwnProperty.call(condition, '$type')) {
    if (condition.$type === 'string') return typeof value === 'string';
    return typeof value === condition.$type;
  }
  if (Object.prototype.hasOwnProperty.call(condition, '$gte') || Object.prototype.hasOwnProperty.call(condition, '$lte')) {
    const dateVal = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateVal.getTime())) return false;
    if (condition.$gte && dateVal < new Date(condition.$gte)) return false;
    if (condition.$lte && dateVal > new Date(condition.$lte)) return false;
    return true;
  }

  return compareValues(value, condition);
}

function matchesMongoFilter(doc, filter = {}) {
  if (!filter || typeof filter !== 'object') return true;

  if (Array.isArray(filter.$or)) {
    if (!filter.$or.some((clause) => matchesMongoFilter(doc, clause))) return false;
  }
  if (Array.isArray(filter.$and)) {
    if (!filter.$and.every((clause) => matchesMongoFilter(doc, clause))) return false;
  }

  for (const [key, condition] of Object.entries(filter)) {
    if (key.startsWith('$')) continue;

    if (key === '_id' || key === 'id') {
      const docId = doc._id ?? doc.id;
      if (condition && typeof condition === 'object' && condition.$ne) {
        if (compareValues(docId, condition.$ne)) continue;
        return false;
      }
      if (!compareValues(docId, condition)) return false;
      continue;
    }

    if (key === 'tags' && typeof condition === 'string') {
      const tags = Array.isArray(doc.tags) ? doc.tags : [];
      if (!tags.includes(condition)) return false;
      continue;
    }

    if (key === 'exlyOfferings.0' && condition?.$exists) {
      const hasOfferings = Array.isArray(doc.exlyOfferings) && doc.exlyOfferings.length > 0;
      if (condition.$exists !== hasOfferings) return false;
      continue;
    }

    if (key === 'exlyOfferings.offeringId' && condition?.$in) {
      const ids = (doc.exlyOfferings || []).map((o) => o?.offeringId).filter(Boolean);
      if (!condition.$in.some((id) => ids.includes(id))) return false;
      continue;
    }

    if (!matchCondition(doc[key], condition)) return false;
  }

  return true;
}

module.exports = { matchesMongoFilter, matchCondition };
