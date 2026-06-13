import { ApiProperty } from '@nestjs/swagger';

export class HealthSummaryDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded'] })
  status!: string;

  @ApiProperty({ example: 'tsc-api' })
  service!: string;

  @ApiProperty({ example: 'production' })
  environment!: string;

  @ApiProperty({ example: '2026-06-13T12:00:00.000Z' })
  timestamp!: string;
}

export class LivenessDto {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status!: string;

  @ApiProperty({ example: 'tsc-api' })
  service!: string;

  @ApiProperty({ example: '2026-06-13T12:00:00.000Z' })
  timestamp!: string;
}

export class DependencyChecksDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded', 'unavailable'] })
  database!: string;

  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded', 'unavailable'] })
  redis!: string;
}

export class ReadinessDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded'] })
  status!: string;

  @ApiProperty({ example: 'tsc-api' })
  service!: string;

  @ApiProperty({ type: DependencyChecksDto })
  checks!: DependencyChecksDto;

  @ApiProperty({ example: '2026-06-13T12:00:00.000Z' })
  timestamp!: string;
}
