import { Module } from '@nestjs/common';
import { TscIdentityModule } from '../tsc-identity/tsc-identity.module';
import { AdminApiKeyController } from './admin-api-key.controller';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { ApiKeyAuthService } from './api-key-auth.service';
import { ApiKeyRateLimitService } from './api-key-rate-limit.service';
import { ApiKeyRepository } from './api-key.repository';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';

@Module({
  imports: [TscIdentityModule],
  controllers: [PublicApiController, AdminApiKeyController],
  providers: [
    PublicApiService,
    ApiKeyRepository,
    ApiKeyAuthService,
    ApiKeyRateLimitService,
    ApiKeyAuthGuard,
  ],
  exports: [PublicApiService, ApiKeyRepository, ApiKeyAuthService],
})
export class PublicApiModule {}
