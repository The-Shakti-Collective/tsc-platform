const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const { protect, requirePageAccess } = require('../../../middleware/authMiddleware');
const { validateBody } = require('../../../validation/validateBody');
const {
  createCampaignBody,
  resendCampaignBody,
  resendFilteredCampaignBody,
} = require('../../../validation/schemas/campaigns');
const campaignApiController = require('../controllers/campaignApiController');
const r2 = require('../../../infrastructure/r2/r2StorageProvider');
const { UPLOAD_DIR } = require('../../../utils/campaignAttachments');

const emailsAccess = requirePageAccess('emails');

router.use(protect, emailsAccess);

if (!r2.isR2Configured() && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = r2.isR2Configured()
  ? multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    })
  : multer({
      storage: multer.diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          cb(null, `${crypto.randomBytes(16).toString('hex')}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    });

router.get('/', campaignApiController.list);
router.post('/upload-attachment', upload.single('file'), campaignApiController.uploadAttachment);
router.get('/:id/recipients/export', campaignApiController.exportRecipients);
router.get('/:id/recipients', campaignApiController.getRecipients);
router.get('/:id', campaignApiController.getById);
router.post('/', validateBody(createCampaignBody), campaignApiController.create);
router.post('/:id/dispatch', campaignApiController.dispatch);
router.post('/:id/resend', validateBody(resendCampaignBody), campaignApiController.resend);
router.post('/:id/resend-filtered', validateBody(resendFilteredCampaignBody), campaignApiController.resendFiltered);
router.post('/:id/stop', campaignApiController.stop);
router.delete('/:id', campaignApiController.remove);

module.exports = router;
