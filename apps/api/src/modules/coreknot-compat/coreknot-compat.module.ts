/**
 * CoreKnot client route aliases on Platform API — **sunset target**.
 * Gated by `PLATFORM_COREKNOT_COMPAT_ENABLED` (default off in production).
 * @see docs/architecture/COREKNOT-BOUNDARY.md
 */
import { Module } from '@nestjs/common';
import { CoreknotCompatGuard } from '../../common/guards/coreknot-compat.guard';
import { CrmModule } from '../crm/crm.module';
import { ProjectModule } from '../project/project.module';
import { TaskModule } from '../task/task.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { CoreknotContextService } from './coreknot-context.service';
import { CampaignsLegacyController } from './campaigns-legacy.controller';
import { CrmLegacyController } from './crm-legacy.controller';
import { ProjectsLegacyController } from './projects-legacy.controller';
import { TasksLegacyController } from './tasks-legacy.controller';

@Module({
  imports: [CrmModule, ProjectModule, TaskModule, WorkspaceModule],
  controllers: [
    CrmLegacyController,
    ProjectsLegacyController,
    TasksLegacyController,
    CampaignsLegacyController,
  ],
  providers: [CoreknotContextService, CoreknotCompatGuard],
})
export class CoreknotCompatModule {}
