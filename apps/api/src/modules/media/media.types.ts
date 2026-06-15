export type R2UploadResult = {
  key: string;
  url: string | null;
  bucket: string;
};

export type PresignedUploadResult = {
  key: string;
  uploadUrl: string;
  method: 'PUT';
  expiresIn: number;
  publicUrl: string | null;
  headers: {
    'Content-Type': string;
  };
};

export type MediaReadinessResponse = {
  configured: boolean;
  bucket: string | null;
  publicUrl: string | null;
  probe: 'ok' | 'degraded' | 'not_configured';
};
