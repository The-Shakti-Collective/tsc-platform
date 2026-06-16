const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const r2 = require('../infrastructure/r2/r2StorageProvider');

const UPLOAD_DIR = path.join(__dirname, '../uploads/campaign-attachments');
const R2_PREFIX = 'coreknot/campaigns';

function campaignObjectKey(storageKey) {
  const key = String(storageKey || '').replace(/^\//, '');
  if (key.startsWith('coreknot/')) return key;
  return `${R2_PREFIX}/${key}`;
}

const loadCampaignAttachments = async (campaignOrList) => {
  const attachments = Array.isArray(campaignOrList)
    ? campaignOrList
    : (campaignOrList?.attachments || []);
  if (!attachments.length) return [];

  const fsPromises = fs.promises;
  const rows = await Promise.all(attachments.map(async (att) => {
    const storageKey = att.storageKey;
    if (!storageKey) {
      logger.warn('campaignAttachments', 'Missing storageKey', { filename: att.filename });
      return null;
    }

    let buffer = null;
    let contentType = att.contentType || 'application/octet-stream';

    if (r2.isR2Configured()) {
      try {
        const object = await r2.getObject(campaignObjectKey(storageKey));
        buffer = object.body;
        contentType = att.contentType || object.contentType;
      } catch (err) {
        logger.warn('campaignAttachments', 'R2 attachment not found', {
          storageKey,
          error: err.message,
        });
      }
    }

    if (!buffer) {
      const filePath = path.join(UPLOAD_DIR, storageKey);
      try {
        await fsPromises.access(filePath);
        buffer = await fsPromises.readFile(filePath);
      } catch {
        logger.warn('campaignAttachments', 'Attachment file not found', { storageKey, filePath });
        return null;
      }
    }

    return {
      filename: att.filename || storageKey,
      contentType,
      buffer,
      contentBase64: buffer.toString('base64'),
    };
  }));
  return rows.filter(Boolean);
};

const formatResendAttachments = (rows) => rows.map((a) => ({
  filename: a.filename,
  content: a.contentBase64,
}));

const formatNodemailerAttachments = (rows) => rows.map((a) => ({
  filename: a.filename,
  content: a.buffer,
  contentType: a.contentType,
}));

module.exports = {
  UPLOAD_DIR,
  R2_PREFIX,
  campaignObjectKey,
  loadCampaignAttachments,
  formatResendAttachments,
  formatNodemailerAttachments,
};
