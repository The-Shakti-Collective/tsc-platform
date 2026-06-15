import {
  Controller,
  Headers,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Webhook } from 'svix';
import { ClerkWebhookService } from './clerk-webhook.service';

@Controller('webhooks')
export class ClerkWebhookController {
  constructor(private readonly webhookService: ClerkWebhookService) {}

  @Post('clerk')
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string | undefined,
    @Headers('svix-timestamp') svixTimestamp: string | undefined,
    @Headers('svix-signature') svixSignature: string | undefined,
  ) {
    const secret = process.env.CLERK_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('CLERK_WEBHOOK_SECRET is not configured');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException('Missing raw body for webhook verification');
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new UnauthorizedException('Missing Svix signature headers');
    }

    const wh = new Webhook(secret);
    let event: { type: string; data: Record<string, unknown> };
    try {
      event = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: Record<string, unknown> };
    } catch {
      throw new UnauthorizedException('Invalid Clerk webhook signature');
    }

    await this.webhookService.handleEvent(event);
    return { received: true };
  }
}
