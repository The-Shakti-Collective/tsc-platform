import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { PassportEditSchema } from './schema';
import { PassportService } from './passport.service';

/** Unauthenticated public passport view */
@Controller('passport')
export class PublicPassportController {
  constructor(private readonly passportService: PassportService) {}

  @Get(':slug/public')
  getPublicPassport(@Param('slug') slug: string) {
    return this.passportService.getPublicPassportBySlug(slug);
  }
}

@Controller('passport')
@UseGuards(ClerkAuthGuard)
export class PassportController {
  constructor(private readonly passportService: PassportService) {}

  @Get(':slug')
  getPassportBySlug(
    @Param('slug') slug: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.passportService.getPassportBySlug(slug, ctx);
  }
}

@Controller('artists')
@UseGuards(ClerkAuthGuard)
export class ArtistPassportController {
  constructor(private readonly passportService: PassportService) {}

  @Get(':id/passport')
  getPassportByArtistId(
    @Param('id') id: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.passportService.getPassportByArtistId(id, ctx);
  }

  @Patch(':id/passport')
  updatePassport(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.passportService.updatePassport(
      id,
      parseSchema(PassportEditSchema, body),
      ctx,
    );
  }
}
