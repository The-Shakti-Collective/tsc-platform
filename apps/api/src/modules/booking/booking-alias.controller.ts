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
  BookingInquiryCreateSchema,
  BookingInquiryListQuerySchema,
} from './schema';
import { BookingService } from './booking.service';

/** CoreKnot client compat — `/api/booking` maps to `/api/booking/inquiries`. */
@Controller('booking')
@UseGuards(ClerkAuthGuard)
export class BookingAliasController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.bookingService.create(
      parseSchema(BookingInquiryCreateSchema, body),
      ctx,
    );
  }

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.bookingService.list(parseSchema(BookingInquiryListQuerySchema, query));
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.bookingService.getDetail(id);
  }

  @Patch(':id/advance')
  advance(@Param('id') id: string) {
    return this.bookingService.updateStatus(id, { advance: true });
  }

  @Post(':id/convert-to-deal')
  convertToDeal(@Param('id') id: string) {
    return this.bookingService.convertToDeal(id);
  }
}
