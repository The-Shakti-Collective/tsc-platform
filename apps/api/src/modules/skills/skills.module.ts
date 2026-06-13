import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { RelationshipModule } from '../relationship/relationship.module';
import { SkillsController } from './skills.controller';
import { SkillsRepository } from './skills.repository';
import { SkillsService } from './skills.service';

@Module({
  imports: [ActivityModule, RelationshipModule],
  controllers: [SkillsController],
  providers: [SkillsService, SkillsRepository],
  exports: [SkillsService, SkillsRepository],
})
export class SkillsModule {}
