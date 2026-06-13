import { Controller, Get } from '@nestjs/common';
import { GraphIntegrationService } from './graph-integration.service';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphIntegrationService) {}

  @Get('edge-types')
  listEdgeTypes() {
    return this.graphService.listSupportedEdgeTypes();
  }
}
