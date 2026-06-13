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
  LabelCreateSchema,
  LabelListQuerySchema,
  LabelSigningStubSchema,
  LabelUpdateSchema,
} from './schema';
import { LabelService } from './label.service';

@Controller('labels')
@UseGuards(ClerkAuthGuard)
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.labelService.list(parseSchema(LabelListQuerySchema, query));
  }

  @Post()
  create(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.labelService.create(parseSchema(LabelCreateSchema, body), ctx);
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.labelService.getDetail(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.labelService.update(id, parseSchema(LabelUpdateSchema, body));
  }

  @Get(':id/roster')
  listRoster(@Param('id') id: string) {
    return this.labelService.listRoster(id);
  }

  @Post(':id/signings')
  recordSigning(@Param('id') id: string, @Body() body: unknown) {
    return this.labelService.recordSigningStub(
      id,
      parseSchema(LabelSigningStubSchema, body),
    );
  }
}
