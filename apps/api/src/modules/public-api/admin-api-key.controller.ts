import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { ApiKeyCreateSchema } from './schema';
import { PublicApiService } from './public-api.service';

@Controller('admin/api-keys')
@UseGuards(ClerkAuthGuard)
export class AdminApiKeyController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Post()
  create(@Body() body: unknown) {
    return this.publicApiService.createApiKey(parseSchema(ApiKeyCreateSchema, body));
  }

  @Get()
  list(@Query('ownerOrgId') ownerOrgId?: string) {
    return this.publicApiService.listApiKeys(ownerOrgId);
  }

  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.publicApiService.revokeApiKey(id);
  }
}
