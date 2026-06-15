import { Injectable, Logger } from '@nestjs/common';
import { ClerkProvisioningService } from './clerk-provisioning.service';

type ClerkWebhookEvent = {
  type: string;
  data: Record<string, unknown>;
};

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(private readonly provisioning: ClerkProvisioningService) {}

  async handleEvent(event: ClerkWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'user.created':
        await this.provisioning.provisionFromClerkUser(
          event.data as Parameters<ClerkProvisioningService['provisionFromClerkUser']>[0],
        );
        break;
      case 'user.updated':
        await this.provisioning.updateFromClerkUser(
          event.data as Parameters<ClerkProvisioningService['updateFromClerkUser']>[0],
        );
        break;
      case 'user.deleted': {
        const clerkUserId = typeof event.data.id === 'string' ? event.data.id : null;
        if (clerkUserId) {
          await this.provisioning.deleteClerkUser(clerkUserId);
        }
        break;
      }
      default:
        this.logger.debug(`Ignored Clerk webhook event: ${event.type}`);
    }
  }
}
