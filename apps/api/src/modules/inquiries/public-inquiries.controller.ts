import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { IpRateLimitGuard } from '../../common/rate-limit/ip-rate-limit.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { InquiriesService } from './inquiries.service';
import { WebsiteContactSecretGuard } from './website-contact-secret.guard';

const PublicContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  interest: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(10).max(4000),
});

@Controller('public/inquiries')
export class PublicInquiriesController {
  constructor(private readonly service: InquiriesService) {}

  /** Website contact form — authenticated via WEBSITE_CONTACT_SECRET header. */
  @Post('contact')
  @UseGuards(WebsiteContactSecretGuard, IpRateLimitGuard)
  createWebsiteContact(@Body() body: unknown) {
    const parsed = parseSchema(PublicContactSchema, body);
    return this.service.createWebsiteContact({
      name: parsed.name,
      email: parsed.email,
      interest: parsed.interest ?? '',
      message: parsed.message,
    });
  }
}
