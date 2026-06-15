import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { TypesenseService } from './typesense.service';

const SearchQuerySchema = z.object({
  q: z.string().default(''),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

@ApiTags('search')
@Controller('search')
@UseGuards(ClerkAuthGuard)
export class SearchController {
  constructor(private readonly typesense: TypesenseService) {}

  @Get()
  @ApiOperation({ summary: 'Unified search (Typesense scaffold)' })
  search(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(SearchQuerySchema, query);
    return this.typesense.search(parsed.q, parsed.limit);
  }

  @Get('health')
  @ApiOperation({ summary: 'Typesense connectivity / configuration status' })
  health() {
    return this.typesense.getHealth();
  }
}
