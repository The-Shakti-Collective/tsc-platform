import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Config, isR2Configured, type R2Config } from './r2.config';
import type { PresignedUploadResult, R2UploadResult } from './media.types';

@Injectable()
export class R2StorageService {
  private client: S3Client | null = null;
  private config: R2Config | null = null;

  private ensureClient(): { client: S3Client; config: R2Config } {
    const config = getR2Config();
    if (!config) {
      throw new ServiceUnavailableException(
        'R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_ENDPOINT.',
      );
    }

    if (!this.client || this.config !== config) {
      this.config = config;
      this.client = new S3Client({
        region: 'auto',
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        forcePathStyle: true,
      });
    }

    return { client: this.client, config };
  }

  isConfigured(): boolean {
    return isR2Configured();
  }

  buildPublicUrl(key: string): string | null {
    const config = getR2Config();
    if (!config?.publicUrl) {
      return null;
    }
    return `${config.publicUrl}/${key.replace(/^\//, '')}`;
  }

  async probeBucket(): Promise<'ok' | 'degraded' | 'not_configured'> {
    if (!isR2Configured()) {
      return 'not_configured';
    }

    try {
      const { client, config } = this.ensureClient();
      await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
      return config.publicUrl ? 'ok' : 'degraded';
    } catch {
      return 'degraded';
    }
  }

  async uploadObject(input: {
    key: string;
    body: Buffer | Uint8Array | string;
    contentType?: string;
    cacheControl?: string;
  }): Promise<R2UploadResult> {
    const { client, config } = this.ensureClient();
    const key = input.key.replace(/^\//, '');

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable',
      }),
    );

    return {
      key,
      url: this.buildPublicUrl(key),
      bucket: config.bucket,
    };
  }

  async deleteObject(key: string): Promise<void> {
    const { client, config } = this.ensureClient();
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key.replace(/^\//, ''),
      }),
    );
  }

  async createPresignedUpload(input: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<PresignedUploadResult> {
    const { client, config } = this.ensureClient();
    const key = input.key.replace(/^\//, '');
    const expiresIn = input.expiresInSeconds ?? 900;

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: input.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn });

    return {
      key,
      uploadUrl,
      method: 'PUT',
      expiresIn,
      publicUrl: this.buildPublicUrl(key),
      headers: {
        'Content-Type': input.contentType,
      },
    };
  }
}
