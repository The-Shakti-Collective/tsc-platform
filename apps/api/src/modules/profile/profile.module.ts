import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { PassportModule } from '../passport/passport.module';
import { TscIdentityModule } from '../tsc-identity/tsc-identity.module';
import { CreativeIdentityModule } from '../creative-identity/creative-identity.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import {
  AdminVerificationController,
  ProfileController,
  PublicProfileController,
} from './profile.controller';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';
import { VerificationService } from './verification.service';

@Module({
  imports: [forwardRef(() => PassportModule), ActivityModule, TscIdentityModule, WorkspaceModule, CreativeIdentityModule],
  controllers: [
    PublicProfileController,
    ProfileController,
    AdminVerificationController,
  ],
  providers: [ProfileService, ProfileRepository, VerificationService],
  exports: [ProfileService, ProfileRepository, VerificationService],
})
export class ProfileModule {}
