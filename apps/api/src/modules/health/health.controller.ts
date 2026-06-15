import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  HealthSummaryDto,
  LivenessDto,
  ReadinessDto,
  DependencyProbeDto,
  StorageProbeDto,
} from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Overall API health summary' })
  @ApiOkResponse({ type: HealthSummaryDto })
  health(): HealthSummaryDto {
    return this.healthService.getSummary();
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe — process alive, no dependency checks' })
  @ApiOkResponse({ type: LivenessDto })
  liveness(): LivenessDto {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe — verifies PostgreSQL and Redis connectivity',
  })
  @ApiOkResponse({ type: ReadinessDto })
  @ApiServiceUnavailableResponse({
    description: 'One or more required dependencies are unavailable',
    type: ReadinessDto,
  })
  async readiness(): Promise<ReadinessDto> {
    const body = await this.healthService.getReadiness();

    if (!this.healthService.isReadinessHealthy(body.checks)) {
      throw new ServiceUnavailableException(body);
    }

    return body;
  }

  @Get('database')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PostgreSQL connectivity probe' })
  @ApiOkResponse({ type: DependencyProbeDto })
  async database(): Promise<DependencyProbeDto> {
    return this.healthService.checkDatabase();
  }

  @Get('redis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redis connectivity probe' })
  @ApiOkResponse({ type: DependencyProbeDto })
  async redis(): Promise<DependencyProbeDto> {
    return this.healthService.checkRedis();
  }

  @Get('storage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'R2/object storage configuration probe' })
  @ApiOkResponse({ type: StorageProbeDto })
  async storage(): Promise<StorageProbeDto> {
    return this.healthService.checkStorage();
  }
}
