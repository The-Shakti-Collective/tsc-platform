#!/usr/bin/env node
/**
 * One-off admin password reset — not for routine use.
 * Usage: node scripts/resetFounderPassword.js [email]
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');

const EMAIL = (process.argv[2] || process.env.ADMIN_EMAIL || 'raghavraj@theshakticollective.in')
  .trim()
  .toLowerCase();

function genPassword(len = 20) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*-_';
  const all = upper + lower + digits + symbols;
  const pick = (s) => s[crypto.randomInt(0, s.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < len) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

async function main() {
  let uri = (process.env.MONGODB_URI || '').trim();
  if (!uri) {
    console.error('MONGODB_URI not set in server/.env');
    process.exit(1);
  }
  // Windows dev: mongodb+srv SRV lookup can fail (querySrv ECONNREFUSED)
  if (uri.startsWith('mongodb+srv://') && process.env.MONGODB_DIRECT_URI) {
    uri = process.env.MONGODB_DIRECT_URI.trim();
  }

  const newPassword = genPassword(20);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });

  const user = await User.findOne({ email: EMAIL }).select('+password name email');
  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(2);
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  console.log('RESET_OK');
  console.log(`EMAIL=${user.email}`);
  console.log(`NAME=${user.name}`);
  console.log(`NEW_PASSWORD=${newPassword}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
