import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreativeIdentityModule } from '../creative-identity/creative-identity.module';
import { WorkspaceContextService } from './workspace-context.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceProvisionService } from './workspace-provision.service';
import { WorkspaceRepository } from './workspace.repository';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [forwardRef(() => ActivityModule), CreativeIdentityModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceRepository,
    WorkspaceProvisionService,
    WorkspaceContextService,
    WorkspaceService,
  ],
  exports: [
    WorkspaceProvisionService,
    WorkspaceService,
    WorkspaceRepository,
    WorkspaceContextService,
  ],
})
export class WorkspaceModule {}
