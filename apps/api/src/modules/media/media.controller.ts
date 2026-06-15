import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { PresignUploadBodySchema } from './dto';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller('media')
@UseGuards(ClerkAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('readiness')
  @ApiOperation({ summary: 'R2 storage configuration and bucket probe' })
  readiness() {
    return this.mediaService.getReadiness();
  }

  @Post('presign')
  @ApiOperation({ summary: 'Create a presigned PUT URL for direct R2 upload' })
  presign(@Body() body: unknown) {
    return this.mediaService.createPresignedUpload(parseSchema(PresignUploadBodySchema, body));
  }
}
