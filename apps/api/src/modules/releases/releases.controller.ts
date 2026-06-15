import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  ReleaseCreateSchema,
  ReleaseIdParamSchema,
  ReleaseListQuerySchema,
  ReleasePatchSchema,
} from './schema';
import { ReleasesService } from './releases.service';

@ApiTags('releases')
@Controller('releases')
@UseGuards(ClerkAuthGuard)
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  @ApiOperation({ summary: 'List releases for an organization' })
  list(@Query() query: Record<string, unknown>) {
    return this.releasesService.list(parseSchema(ReleaseListQuerySchema, query));
  }

  @Post()
  @ApiOperation({ summary: 'Create a release with optional tracks' })
  create(@Body() body: unknown) {
    return this.releasesService.create(parseSchema(ReleaseCreateSchema, body));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get release by id' })
  getById(@Param() params: Record<string, unknown>) {
    const { id } = parseSchema(ReleaseIdParamSchema, params);
    return this.releasesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update release metadata' })
  patch(@Param() params: Record<string, unknown>, @Body() body: unknown) {
    const { id } = parseSchema(ReleaseIdParamSchema, params);
    return this.releasesService.patch(id, parseSchema(ReleasePatchSchema, body));
  }
}
