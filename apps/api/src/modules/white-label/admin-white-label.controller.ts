import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { WhiteLabelTenantCreateSchema } from './schema';
import { WhiteLabelService } from './white-label.service';

@Controller('admin/white-label/tenants')
@UseGuards(ClerkAuthGuard)
export class AdminWhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  @Post()
  create(@Body() body: unknown) {
    return this.whiteLabelService.createTenant(parseSchema(WhiteLabelTenantCreateSchema, body));
  }
}
