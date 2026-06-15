import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { R2StorageService } from './r2-storage.service';

@Module({
  controllers: [MediaController],
  providers: [R2StorageService, MediaService],
  exports: [R2StorageService, MediaService],
})
export class MediaModule {}
