import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { ProfileModule } from '../profile/profile.module';
import { ClerkProvisioningService } from './clerk-provisioning.service';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';

@Module({
  imports: [IdentityModule, ProfileModule],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService, ClerkProvisioningService],
  exports: [ClerkProvisioningService],
})
export class ClerkWebhookModule {}
