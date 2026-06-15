require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { parseAsync } = require('json2csv');
const PersonIndex = require('../models/PersonIndex');
const PersonHubView = require('../models/PersonHubView');
const { bypassOptions } = require('../infrastructure/database/bypassTenantPolicy');
const { buildFolderQuery } = require('../domains/data-hub/queryHelpers');

const CONTACT_BYPASS = bypassOptions('data_hub');
const OUTPUT_PATH = path.join(__dirname, '../../data/exly-and-active-people.csv');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function dedupeKey(row) {
  const email = normalizeEmail(row.email);
  const phone = normalizePhone(row.phone);
  if (email) return `email:${email}`;
  if (phone) return `phone:${phone}`;
  return `name:${String(row.name || '').trim().toLowerCase()}`;
}

async function resolveHubModel() {
  const [hubCount, indexCount, hubWithInlets] = await Promise.all([
    PersonHubView.countDocuments({}).setOptions(CONTACT_BYPASS),
    PersonIndex.countDocuments({}).setOptions(CONTACT_BYPASS),
    PersonHubView.countDocuments({
      $or: [
        { inletCount: { $gte: 1 } },
        { inCRM: true },
        { inExly: true },
        { inOutsourced: true },
        { inMailer: true },
        { inBookedCalls: true },
        { inNewsletter: true },
        { inArtistPath: true },
        { inArtistCrm: true },
        { inEnquiries: true },
      ],
    }).setOptions(CONTACT_BYPASS),
  ]);

  const useHubView = hubCount > 0 && (
    indexCount === 0
    || hubCount >= indexCount * 0.9
    || hubWithInlets >= Math.max(indexCount, hubCount) * 0.5
  );
  return useHubView ? PersonHubView : PersonIndex;
}

async function fetchFolderPeople(HubModel, folder) {
  const query = buildFolderQuery(folder);
  return HubModel.find(query)
    .setOptions(CONTACT_BYPASS)
    .select('name email phone')
    .lean();
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const HubModel = await resolveHubModel();
  const modelName = HubModel.modelName;
  console.log(`Using hub model: ${modelName}`);

  const [exlyRows, activeRows] = await Promise.all([
    fetchFolderPeople(HubModel, 'exly'),
    fetchFolderPeople(HubModel, 'active'),
  ]);

  const merged = new Map();
  for (const row of exlyRows) {
    const key = dedupeKey(row);
    merged.set(key, {
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      inExly: true,
      inActive: false,
    });
  }

  for (const row of activeRows) {
    const key = dedupeKey(row);
    const existing = merged.get(key);
    if (existing) {
      existing.inActive = true;
      if (!existing.name && row.name) existing.name = row.name;
      if (!existing.email && row.email) existing.email = row.email;
      if (!existing.phone && row.phone) existing.phone = row.phone;
      continue;
    }
    merged.set(key, {
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      inExly: false,
      inActive: true,
    });
  }

  const rows = [...merged.values()]
    .map(({ name, email, phone }) => ({ name, email, phone: phone || '' }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const csv = await parseAsync(rows, {
    fields: ['name', 'email', 'phone'],
  });

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, csv, 'utf8');

  console.log(`Exly folder: ${exlyRows.length}`);
  console.log(`Active folder: ${activeRows.length}`);
  console.log(`Combined unique rows: ${rows.length}`);
  console.log(`Written to: ${OUTPUT_PATH}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
