#!/usr/bin/env node
/**
 * Smoke test: upload → download → presigned PUT → delete against configured R2 bucket.
 * Usage (from apps/coreknot/server): npm run storage:verify-r2
 * Loads apps/coreknot/server/.env then repo root .env (same order as dev scripts).
 */
const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const r2 = require('../infrastructure/r2/r2StorageProvider');

async function main() {
  const probe = await r2.probeBucket();
  if (probe === 'not_configured') {
    console.error('FAIL: R2 env vars not set (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT)');
    console.error('Hint: set in apps/coreknot/server/.env and/or repo root .env (see .env.coreknot.example)');
    process.exit(1);
  }

  console.log(`R2 probe: ${probe}`);

  const key = `coreknot/_verify/${crypto.randomUUID()}.txt`;
  const payload = `tsc-r2-verify-${Date.now()}`;

  const uploaded = await r2.uploadObject({
    key,
    body: Buffer.from(payload, 'utf8'),
    contentType: 'text/plain',
  });
  console.log('upload:', uploaded.key, uploaded.url || '(no R2_PUBLIC_URL)');

  const downloaded = await r2.getObject(key);
  const text = downloaded.body.toString('utf8');
  if (text !== payload) {
    console.error('FAIL: downloaded content mismatch');
    process.exit(1);
  }
  console.log('download: ok');

  const presignKey = `coreknot/_verify/${crypto.randomUUID()}-presign.txt`;
  const presignPayload = `tsc-r2-presign-${Date.now()}`;
  const presigned = await r2.createPresignedUpload({
    key: presignKey,
    contentType: 'text/plain',
  });
  const presignRes = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: presigned.headers,
    body: presignPayload,
  });
  if (!presignRes.ok) {
    console.error(`FAIL: presigned PUT ${presignRes.status}`);
    process.exit(1);
  }
  const presignDownload = await r2.getObject(presignKey);
  if (presignDownload.body.toString('utf8') !== presignPayload) {
    console.error('FAIL: presigned upload content mismatch');
    process.exit(1);
  }
  console.log('presigned-upload: ok');

  if (presigned.publicUrl) {
    const publicRes = await fetch(presigned.publicUrl);
    if (!publicRes.ok) {
      console.warn(`WARN: public URL fetch ${publicRes.status} — check bucket public access / CDN`);
    } else {
      console.log('public-url: ok');
    }
  } else {
    console.log('public-url: skipped (R2_PUBLIC_URL unset — degraded mode)');
  }

  await r2.deleteObject(key);
  await r2.deleteObject(presignKey);
  console.log('delete: ok');
  console.log('PASS: R2 upload/download/delete verified');
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
