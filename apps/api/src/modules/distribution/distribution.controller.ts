import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  DistributionChannelCreateSchema,
  DistributionListQuerySchema,
  DistributionSubmissionCreateSchema,
} from './schema';
import { DistributionService } from './distribution.service';

@ApiTags('distribution')
@Controller('distribution')
@UseGuards(ClerkAuthGuard)
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Get('channels')
  @ApiOperation({ summary: 'List distribution channels (DistroKid, manual, etc.)' })
  listChannels(@Query() query: Record<string, unknown>) {
    return this.distributionService.listChannels(parseSchema(DistributionListQuerySchema, query));
  }

  @Post('channels')
  @ApiOperation({ summary: 'Create a distribution channel for an artist' })
  createChannel(@Body() body: unknown) {
    return this.distributionService.createChannel(
      parseSchema(DistributionChannelCreateSchema, body),
    );
  }

  @Get('submissions')
  @ApiOperation({ summary: 'List distribution submissions' })
  listSubmissions(@Query() query: Record<string, unknown>) {
    return this.distributionService.listSubmissions(parseSchema(DistributionListQuerySchema, query));
  }

  @Post('submissions')
  @ApiOperation({ summary: 'Submit release to distributor (stub when not configured)' })
  createSubmission(@Body() body: unknown) {
    return this.distributionService.createSubmission(
      parseSchema(DistributionSubmissionCreateSchema, body),
    );
  }
}
