import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  MergeIdentitySchema,
  PersonUpdateSchema,
  ResolveIdentitySchema,
} from './schema';
import { IdentityService } from './identity.service';

@Controller('identity')
@UseGuards(ClerkAuthGuard)
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('resolve')
  resolve(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.identityService.resolve(
      parseSchema(ResolveIdentitySchema, body),
      ctx,
    );
  }

  @Post('merge')
  merge(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.identityService.merge(
      parseSchema(MergeIdentitySchema, body),
      ctx,
    );
  }

  @Get('persons/:id/360')
  getPerson360(
    @Param('id') id: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.identityService.getPerson360(id, ctx);
  }

  @Get('persons/:id')
  getPerson(@Param('id') id: string) {
    return this.identityService.getPerson(id);
  }

  @Get('persons/by-username/:username')
  getPersonByUsername(@Param('username') username: string) {
    return this.identityService.getPersonByUsername(username);
  }

  @Patch('persons/:id')
  @UseGuards(ClerkAuthGuard)
  updatePerson(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.identityService.updatePerson(
      id,
      parseSchema(PersonUpdateSchema, body),
      ctx,
    );
  }
}
