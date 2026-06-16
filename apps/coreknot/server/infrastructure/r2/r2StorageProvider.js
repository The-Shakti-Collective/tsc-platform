const {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getR2Config, isR2Configured } = require('./r2Config');

let client = null;
let cachedConfig = null;

function ensureClient() {
  const config = getR2Config();
  if (!config) {
    const err = new Error(
      'R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_ENDPOINT.',
    );
    err.code = 'R2_NOT_CONFIGURED';
    throw err;
  }

  if (!client || cachedConfig !== config) {
    cachedConfig = config;
    client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  return { client, config };
}

function normalizeKey(key) {
  return String(key || '').replace(/^\//, '');
}

function buildPublicUrl(key) {
  const config = getR2Config();
  if (!config?.publicUrl) return null;
  return `${config.publicUrl}/${normalizeKey(key)}`;
}

async function probeBucket() {
  if (!isR2Configured()) return 'not_configured';

  try {
    const { client, config } = ensureClient();
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
    return config.publicUrl ? 'ok' : 'degraded';
  } catch {
    return 'degraded';
  }
}

async function uploadObject({ key, body, contentType, cacheControl }) {
  const { client, config } = ensureClient();
  const normalizedKey = normalizeKey(key);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: normalizedKey,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl || 'public, max-age=31536000, immutable',
    }),
  );

  return {
    key: normalizedKey,
    url: buildPublicUrl(normalizedKey),
    bucket: config.bucket,
  };
}

async function getObject(key) {
  const { client, config } = ensureClient();
  const normalizedKey = normalizeKey(key);
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: normalizedKey,
    }),
  );

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return {
    key: normalizedKey,
    body: Buffer.concat(chunks),
    contentType: response.ContentType || 'application/octet-stream',
  };
}

async function deleteObject(key) {
  const { client, config } = ensureClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: normalizeKey(key),
    }),
  );
}

async function createPresignedUpload({ key, contentType, expiresInSeconds = 900 }) {
  const { client, config } = ensureClient();
  const normalizedKey = normalizeKey(key);

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: normalizedKey,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    key: normalizedKey,
    uploadUrl,
    method: 'PUT',
    expiresIn: expiresInSeconds,
    publicUrl: buildPublicUrl(normalizedKey),
    headers: {
      'Content-Type': contentType,
    },
  };
}

function isR2ObjectKey(key) {
  return normalizeKey(key).startsWith('coreknot/');
}

module.exports = {
  isR2Configured,
  buildPublicUrl,
  probeBucket,
  uploadObject,
  getObject,
  deleteObject,
  createPresignedUpload,
  isR2ObjectKey,
};
