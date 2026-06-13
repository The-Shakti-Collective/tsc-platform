import { Module, forwardRef } from '@nestjs/common';
import { DataExchangeModule } from '../data-exchange/data-exchange.module';
import { AdminIdentityController, TscIdentityNetworkController } from './tsc-identity.controller';
import { TscIdentityNetworkService } from './tsc-identity-network.service';
import { TscIdentityProvisionService } from './tsc-identity-provision.service';
import { TscIdentityRepository } from './tsc-identity.repository';

@Module({
  imports: [forwardRef(() => DataExchangeModule)],
  controllers: [TscIdentityNetworkController, AdminIdentityController],
  providers: [
    TscIdentityRepository,
    TscIdentityProvisionService,
    TscIdentityNetworkService,
  ],
  exports: [TscIdentityProvisionService, TscIdentityNetworkService, TscIdentityRepository],
})
export class TscIdentityModule {}
