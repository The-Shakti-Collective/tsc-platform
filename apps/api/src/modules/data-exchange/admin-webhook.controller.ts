import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  WebhookDeliveriesQuerySchema,
  WebhookSubscriptionCreateSchema,
} from './schema';
import { WebhookService } from './webhook.service';

@Controller('admin/webhooks')
@UseGuards(ClerkAuthGuard)
export class AdminWebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  create(@Body() body: unknown) {
    return this.webhookService.createSubscription(
      parseSchema(WebhookSubscriptionCreateSchema, body),
    );
  }

  @Get()
  list(@Query('apiKeyId') apiKeyId?: string) {
    return this.webhookService.listSubscriptions(apiKeyId);
  }

  @Get('deliveries')
  deliveries(@Query() query: Record<string, unknown>) {
    return this.webhookService.listDeliveries(
      parseSchema(WebhookDeliveriesQuerySchema, query),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webhookService.deleteSubscription(id);
  }

  @Post(':id/test')
  test(@Param('id') id: string) {
    return this.webhookService.sendTest(id);
  }
}
