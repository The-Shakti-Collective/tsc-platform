import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { getR2Config } from './r2.config';
import type { PresignUploadBody } from './dto';
import type { MediaReadinessResponse } from './media.types';
import { R2StorageService } from './r2-storage.service';

const SAFE_FILENAME = /[^a-zA-Z0-9._-]+/g;

@Injectable()
export class MediaService {
  constructor(private readonly storage: R2StorageService) {}

  async getReadiness(): Promise<MediaReadinessResponse> {
    const config = getR2Config();
    const probe = await this.storage.probeBucket();

    return {
      configured: this.storage.isConfigured(),
      bucket: config?.bucket ?? null,
      publicUrl: config?.publicUrl ?? null,
      probe,
    };
  }

  createPresignedUpload(body: PresignUploadBody) {
    const tenantSegment = body.tenantId?.replace(/[^\w-]/g, '') || 'shared';
    const safeName = body.filename.replace(SAFE_FILENAME, '_').slice(0, 120);
    const key = `coreknot/${body.prefix}/${tenantSegment}/${randomUUID()}-${safeName}`;

    return this.storage.createPresignedUpload({
      key,
      contentType: body.contentType,
    });
  }
}
