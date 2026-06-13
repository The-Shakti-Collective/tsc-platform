import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { RelationshipModule } from '../relationship/relationship.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectController } from './project.controller';
import { ProjectRepository } from './project.repository';
import { ProjectService } from './project.service';

@Module({
  imports: [
    forwardRef(() => ActivityModule),
    forwardRef(() => RelationshipModule),
    WorkspaceModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectRepository, ProjectService],
  exports: [ProjectService, ProjectRepository],
})
export class ProjectModule {}
