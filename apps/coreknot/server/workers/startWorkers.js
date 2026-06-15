#!/usr/bin/env node
/**
 * CoreKnot background worker entry — mail campaigns + optional BullMQ consumers.
 * Run separately from the HTTP server (Render Background Worker / Railway worker service).
 *
 *   pnpm start:coreknot:workers
 *   RUN_WORKERS=true node workers/startWorkers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

process.env.RUN_WORKERS = 'true';

const logger = require('../utils/logger');
const { connectMongo, bootstrapMongoSideEffects, applyMongooseDefaults } = require('../services/mongoConnectionService');

applyMongooseDefaults();

let shuttingDown = false;
const closers = [];

async function start() {
  logger.info('workers', 'Starting CoreKnot background workers…');

  await connectMongo({ reason: 'workers' });
  await bootstrapMongoSideEffects();

  const { initMailCampaignWorker } = require('./mailCampaignWorker');
  const mailWorker = initMailCampaignWorker();
  if (mailWorker) {
    closers.push(async () => {
      const { closeMailCampaignWorker } = require('./mailCampaignWorker');
      await closeMailCampaignWorker();
    });
  }

  const { resumeStuckCampaigns } = require('../services/queueService');
  setTimeout(() => {
    resumeStuckCampaigns().catch((err) => {
      logger.warn('workers', 'Campaign resume skipped', { error: err.message });
    });
  }, 5000);

  logger.info('workers', 'Worker process ready');
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('workers', `Shutting down (${signal || 'signal'})…`);

  const deadline = Date.now() + 30000;
  for (const close of closers.reverse()) {
    try {
      await close();
    } catch (err) {
      logger.warn('workers', 'Close hook failed', { error: err.message });
    }
  }

  const { drainMemoryQueue } = require('../services/queueService');
  await drainMemoryQueue(Math.max(0, deadline - Date.now()));

  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close().catch(() => {});
  }

  process.exit(0);
}

process.once('SIGTERM', () => { shutdown('SIGTERM'); });
process.once('SIGINT', () => { shutdown('SIGINT'); });

start().catch((err) => {
  logger.error('workers', 'Worker bootstrap failed', { error: err.message });
  process.exit(1);
});
