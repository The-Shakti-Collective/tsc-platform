import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  AiEmailRequestSchema,
  AiPitchRequestSchema,
  AiProposalRequestSchema,
} from './schema';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
@UseGuards(ClerkAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('capabilities')
  @ApiOperation({ summary: 'List AI copilot service capabilities (stub until LLM keys configured)' })
  getCapabilities() {
    return this.aiService.getCapabilities();
  }

  @Post('proposal')
  @ApiOperation({ summary: 'Generate a proposal draft (stub)' })
  generateProposal(@Body() body: unknown) {
    return this.aiService.generateProposal(parseSchema(AiProposalRequestSchema, body));
  }

  @Post('pitch')
  @ApiOperation({ summary: 'Generate a pitch draft (stub)' })
  writePitch(@Body() body: unknown) {
    return this.aiService.writePitch(parseSchema(AiPitchRequestSchema, body));
  }

  @Post('email')
  @ApiOperation({ summary: 'Generate an email draft (stub)' })
  writeEmail(@Body() body: unknown) {
    return this.aiService.writeEmail(parseSchema(AiEmailRequestSchema, body));
  }
}
