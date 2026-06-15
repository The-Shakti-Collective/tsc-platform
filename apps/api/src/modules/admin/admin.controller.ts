import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('system-health')
  @ApiOperation({ summary: 'Admin system health probe (CoreKnot compat)' })
  getSystemHealth() {
    return this.adminService.getSystemHealthDetailed();
  }

  @Get('roles')
  @ApiOperation({ summary: 'List org and project roles (stub catalog)' })
  listRoles() {
    return this.adminService.listRoles();
  }

  @Get('scripts')
  @ApiOperation({ summary: 'List admin scripts (stub catalog)' })
  listScripts() {
    return this.adminService.listScripts();
  }

  @Get('queues/status')
  @ApiOperation({ summary: 'Queue status summary (stub)' })
  getQueueStatus() {
    return this.adminService.getQueueStatus();
  }
}
