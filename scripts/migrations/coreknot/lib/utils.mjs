/**
 * Shared transform utilities.
 */

export function slugify(value, fallback = 'item') {
  const base = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return base || fallback;
}

export function normalizeEmail(email) {
  if (!email) return null;
  const v = String(email).trim().toLowerCase();
  return v.includes('@') ? v : null;
}

export function normalizePhone(phone) {
  if (!phone) return null;
  const v = String(phone).trim();
  return v.length > 0 ? v : null;
}

export function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function splitLocation(location) {
  if (!location) return { venue: null, city: null };
  const parts = String(location)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { venue: parts[0], city: parts.slice(1).join(', ') };
  }
  return { venue: location, city: null };
}

export function notesFromLead(doc) {
  const chunks = [];
  if (doc.remarks) chunks.push(String(doc.remarks));
  if (Array.isArray(doc.notes)) {
    for (const n of doc.notes) {
      if (n?.text) chunks.push(String(n.text));
    }
  }
  const joined = chunks.join('\n\n').trim();
  return joined || null;
}

export function clerkPlaceholderId(mongoUserId) {
  return `coreknot_pending_${mongoUserId}`;
}

export function defaultOrgSlug(name) {
  const slug = slugify(name, 'tsc-default');
  return slug === 'default-tenant' ? 'tsc-default' : slug;
}
