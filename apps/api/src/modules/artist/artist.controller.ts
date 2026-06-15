import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { ArtistCreateSchema, ArtistListQuerySchema } from './dto';
import { ArtistService } from './artist.service';

@Controller('artists')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class ArtistController {
  constructor(private readonly service: ArtistService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(ArtistListQuerySchema, query);
    return this.service.list({ limit: parsed.limit, q: parsed.q });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER', 'ARTIST')
  create(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.create(parseSchema(ArtistCreateSchema, body), ctx);
  }
}
