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
  BookingInquiryStatusUpdateSchema,
} from './schema';
import { BookingService } from './booking.service';

@Controller('booking/inquiries')
@UseGuards(ClerkAuthGuard)
export class BookingController {
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

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: unknown) {
    return this.bookingService.updateStatus(
      id,
      parseSchema(BookingInquiryStatusUpdateSchema, body),
    );
  }

  @Post(':id/convert-to-deal')
  convertToDeal(@Param('id') id: string) {
    return this.bookingService.convertToDeal(id);
  }
}
