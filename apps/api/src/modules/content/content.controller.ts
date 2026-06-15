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
  ContentAssetCreateSchema,
  ContentItemCreateSchema,
  ContentItemIdParamSchema,
  ContentItemPatchSchema,
  ContentListQuerySchema,
} from './schema';
import { ContentService } from './content.service';

@ApiTags('content')
@Controller('content')
@UseGuards(ClerkAuthGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('assets')
  @ApiOperation({ summary: 'List content assets for an artist' })
  listAssets(@Query() query: Record<string, unknown>) {
    return this.contentService.listAssets(parseSchema(ContentListQuerySchema, query));
  }

  @Post('assets')
  @ApiOperation({ summary: 'Register a content asset (R2/storage key or URL)' })
  createAsset(@Body() body: unknown) {
    return this.contentService.createAsset(parseSchema(ContentAssetCreateSchema, body));
  }

  @Get('items')
  @ApiOperation({ summary: 'List content items for an artist' })
  listItems(@Query() query: Record<string, unknown>) {
    return this.contentService.listItems(parseSchema(ContentListQuerySchema, query));
  }

  @Post('items')
  @ApiOperation({ summary: 'Create a content item' })
  createItem(@Body() body: unknown) {
    return this.contentService.createItem(parseSchema(ContentItemCreateSchema, body));
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a content item' })
  patchItem(@Param() params: Record<string, unknown>, @Body() body: unknown) {
    const { id } = parseSchema(ContentItemIdParamSchema, params);
    return this.contentService.patchItem(id, parseSchema(ContentItemPatchSchema, body));
  }
}
