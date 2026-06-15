import { Global, Module } from '@nestjs/common';
import { IdentityModule } from '../../modules/identity/identity.module';
import { ProfileModule } from '../../modules/profile/profile.module';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { LegacyJwtService } from './legacy-jwt.service';
import { MembershipContextService } from './membership-context.service';
import { RolesGuard } from './roles.guard';
import { StubAuthGuard } from './stub-auth.guard';

@Global()
@Module({
  imports: [IdentityModule, ProfileModule],
  providers: [
    MembershipContextService,
    LegacyJwtService,
    StubAuthGuard,
    ClerkAuthGuard,
    RolesGuard,
  ],
  exports: [
    MembershipContextService,
    LegacyJwtService,
    StubAuthGuard,
    ClerkAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
