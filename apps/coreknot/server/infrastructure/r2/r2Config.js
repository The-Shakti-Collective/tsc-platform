function trim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getR2Config() {
  const accessKeyId = trim(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = trim(process.env.R2_SECRET_ACCESS_KEY);
  const bucket = trim(process.env.R2_BUCKET);
  const endpoint = trim(process.env.R2_ENDPOINT);

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    return null;
  }

  const publicUrl = trim(process.env.R2_PUBLIC_URL).replace(/\/$/, '') || null;

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    publicUrl,
  };
}

function isR2Configured() {
  return getR2Config() !== null;
}

module.exports = {
  getR2Config,
  isR2Configured,
};
