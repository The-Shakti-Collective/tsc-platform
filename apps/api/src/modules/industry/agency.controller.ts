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
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  AgencyCreateSchema,
  AgencyListQuerySchema,
  AgencyUpdateSchema,
} from './schema';
import { AgencyService } from './agency.service';

@Controller('agencies')
@UseGuards(ClerkAuthGuard)
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.agencyService.list(parseSchema(AgencyListQuerySchema, query));
  }

  @Post()
  create(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.agencyService.create(parseSchema(AgencyCreateSchema, body), ctx);
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.agencyService.getDetail(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.agencyService.update(id, parseSchema(AgencyUpdateSchema, body));
  }

  @Get(':id/artists')
  listArtists(@Param('id') id: string) {
    return this.agencyService.listArtists(id);
  }
}
