import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  RoyaltyListQuerySchema,
  RoyaltyStatementCreateSchema,
  RoyaltyStatementIdParamSchema,
} from './schema';
import { RoyaltiesService } from './royalties.service';

@ApiTags('royalties')
@Controller('royalties')
@UseGuards(ClerkAuthGuard)
export class RoyaltiesController {
  constructor(private readonly royaltiesService: RoyaltiesService) {}

  @Get()
  @ApiOperation({ summary: 'List royalty accruals (per release)' })
  listRoyalties(@Query() query: Record<string, unknown>) {
    return this.royaltiesService.listRoyalties(parseSchema(RoyaltyListQuerySchema, query));
  }

  @Get('statements')
  @ApiOperation({ summary: 'List royalty statements for an organization' })
  listStatements(@Query() query: Record<string, unknown>) {
    return this.royaltiesService.listStatements(parseSchema(RoyaltyListQuerySchema, query));
  }

  @Post('statements')
  @ApiOperation({ summary: 'Create a royalty statement with optional line items' })
  createStatement(@Body() body: unknown) {
    return this.royaltiesService.createStatement(parseSchema(RoyaltyStatementCreateSchema, body));
  }

  @Get('statements/:id')
  @ApiOperation({ summary: 'Get royalty statement by id' })
  @ApiOkResponse({ description: 'Royalty statement with line items' })
  getStatement(@Param() params: Record<string, unknown>) {
    const { id } = parseSchema(RoyaltyStatementIdParamSchema, params);
    return this.royaltiesService.getStatement(id);
  }
}
