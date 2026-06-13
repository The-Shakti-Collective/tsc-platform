import { Module } from '@nestjs/common';
import {
  ArtistContractsController,
  BrandContractsController,
  ContractController,
} from './contract.controller';
import { ContractRepository } from './contract.repository';
import { ContractService } from './contract.service';

@Module({
  controllers: [ContractController, ArtistContractsController, BrandContractsController],
  providers: [ContractService, ContractRepository],
  exports: [ContractService, ContractRepository],
})
export class ContractModule {}
