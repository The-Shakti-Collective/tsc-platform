import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { TaskController } from './task.controller';
import { TaskRepository } from './task.repository';
import { TaskService } from './task.service';

@Module({
  imports: [forwardRef(() => ActivityModule), WorkspaceModule],
  controllers: [TaskController],
  providers: [TaskRepository, TaskService],
  exports: [TaskService, TaskRepository],
})
export class TaskModule {}
