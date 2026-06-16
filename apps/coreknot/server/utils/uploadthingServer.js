const crypto = require('crypto');
const { UTApi, UTFile } = require('uploadthing/server');
const r2 = require('../infrastructure/r2/r2StorageProvider');

let utApiKey;
try {
  const tokenData = JSON.parse(Buffer.from(process.env.UPLOADTHING_TOKEN || '', 'base64').toString());
  utApiKey = tokenData.apiKey;
} catch {
  utApiKey = process.env.UPLOADTHING_SECRET;
}

const utapi = utApiKey ? new UTApi({ apiKey: utApiKey }) : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SAFE_FILENAME = /[^a-zA-Z0-9._-]+/g;

function buildR2Key(prefix, originalname) {
  const safeName = String(originalname || 'file').replace(SAFE_FILENAME, '_').slice(0, 120);
  return `coreknot/${prefix}/${crypto.randomBytes(16).toString('hex')}-${safeName}`;
}

const uploadOneFileToR2 = async (file, prefix = 'finance') => {
  const key = buildR2Key(prefix, file.originalname);
  const result = await r2.uploadObject({
    key,
    body: file.buffer,
    contentType: file.mimetype,
  });
  return {
    url: result.url,
    key: result.key,
    name: file.originalname,
    size: file.size,
    type: file.mimetype,
  };
};

const uploadOneFileToUT = async (file, maxAttempts = 3) => {
  if (!utapi) throw new Error('UploadThing is not configured');
  let lastError = 'Upload failed';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const utFile = new UTFile([file.buffer], file.originalname, { type: file.mimetype });
      const uploadResult = await utapi.uploadFiles([utFile]);

      if (uploadResult[0]?.data) {
        const { url, key, name } = uploadResult[0].data;
        return {
          url: url || uploadResult[0].data.ufsUrl,
          key,
          name: name || file.originalname,
          size: file.size,
          type: file.mimetype,
        };
      }
      lastError = uploadResult[0]?.error?.message || lastError;
    } catch (err) {
      lastError = err.message || lastError;
    }
    if (attempt < maxAttempts) await sleep(1500 * attempt);
  }
  throw new Error(lastError);
};

const uploadOneFile = async (file, prefix = 'finance') => {
  if (r2.isR2Configured()) {
    return uploadOneFileToR2(file, prefix);
  }
  return uploadOneFileToUT(file);
};

const uploadSingleMulterFile = async (file, prefix = 'finance') => {
  if (!file) throw new Error('No file provided');
  return uploadOneFile(file, prefix);
};

const uploadManyMulterFiles = async (files = [], prefix = 'finance') => {
  const data = [];
  const failed = [];

  for (const file of files) {
    try {
      const result = await uploadOneFile(file, prefix);
      data.push(result);
    } catch (err) {
      failed.push({ fileName: file.originalname, error: err.message });
    }
    await sleep(300);
  }

  return { data, failed };
};

const deleteStoredFile = async (fileKey) => {
  if (!fileKey) return;
  if (r2.isR2ObjectKey(fileKey)) {
    await r2.deleteObject(fileKey);
    return;
  }
  if (utapi) {
    await utapi.deleteFiles(fileKey);
  }
};

const handleUploadFilesManyRequest = async (req, res) => {
  const prefix = typeof req.uploadPrefix === 'string' ? req.uploadPrefix : 'finance';
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }

    const { data, failed } = await uploadManyMulterFiles(files, prefix);
    const message = failed.length
      ? `${data.length} uploaded, ${failed.length} failed`
      : `${data.length} file(s) uploaded`;

    res.status(failed.length && data.length === 0 ? 500 : 200).json({
      success: data.length > 0,
      data,
      failed,
      message,
    });
  } catch (error) {
    console.error('Multi file upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'File upload failed' });
  }
};

const handleUploadSingleRequest = async (req, res) => {
  const prefix = typeof req.uploadPrefix === 'string' ? req.uploadPrefix : 'finance';
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }
    const result = await uploadSingleMulterFile(req.file, prefix);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'File upload failed' });
  }
};

module.exports = {
  utapi,
  uploadOneFile,
  uploadOneFileToUT,
  uploadOneFileToR2,
  uploadSingleMulterFile,
  uploadManyMulterFiles,
  deleteStoredFile,
  handleUploadFilesManyRequest,
  handleUploadSingleRequest,
};
