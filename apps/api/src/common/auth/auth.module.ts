import { Global, Module } from '@nestjs/common';
import { IdentityModule } from '../../modules/identity/identity.module';
import { ProfileModule } from '../../modules/profile/profile.module';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { MembershipContextService } from './membership-context.service';
import { StubAuthGuard } from './stub-auth.guard';

@Global()
@Module({
  imports: [IdentityModule, ProfileModule],
  providers: [MembershipContextService, StubAuthGuard, ClerkAuthGuard],
  exports: [MembershipContextService, StubAuthGuard, ClerkAuthGuard],
})
export class AuthModule {}
