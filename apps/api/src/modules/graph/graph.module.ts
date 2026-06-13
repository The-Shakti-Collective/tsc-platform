import { Module } from '@nestjs/common';
import { GraphController } from './graph.controller';
import { GraphIntegrationService } from './graph-integration.service';

@Module({
  controllers: [GraphController],
  providers: [GraphIntegrationService],
  exports: [GraphIntegrationService],
})
export class GraphModule {}
