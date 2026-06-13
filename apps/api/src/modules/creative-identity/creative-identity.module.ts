import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { SkillsModule } from '../skills/skills.module';
import { TscIdentityModule } from '../tsc-identity/tsc-identity.module';
import {
  CreativeIdentityController,
  PublicCreativeIdentityController,
} from './creative-identity.controller';
import { CreativeIdentityRepository } from './creative-identity.repository';
import { CreativeIdentityService } from './creative-identity.service';

@Module({
  imports: [ActivityModule, TscIdentityModule, SkillsModule],
  controllers: [PublicCreativeIdentityController, CreativeIdentityController],
  providers: [CreativeIdentityService, CreativeIdentityRepository],
  exports: [CreativeIdentityService],
})
export class CreativeIdentityModule {}
