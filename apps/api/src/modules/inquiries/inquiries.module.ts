import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { PublicInquiriesController } from './public-inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { WebsiteContactSecretGuard } from './website-contact-secret.guard';

@Module({
  controllers: [InquiriesController, PublicInquiriesController],
  providers: [InquiriesService, WebsiteContactSecretGuard],
  exports: [InquiriesService],
})
export class InquiriesModule {}
