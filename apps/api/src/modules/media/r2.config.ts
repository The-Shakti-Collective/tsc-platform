export type R2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
  publicUrl: string | null;
};

export function getR2Config(): R2Config | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? '';
  const bucket = process.env.R2_BUCKET?.trim() ?? '';
  const endpoint = process.env.R2_ENDPOINT?.trim() ?? '';

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    return null;
  }

  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, '') || null;

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    publicUrl,
  };
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}
