import { SetMetadata } from '@nestjs/common';
import type { PlatformRole } from '@tsc/permissions';

export const ROLES_KEY = 'platform_roles';

export const Roles = (...roles: PlatformRole[]) => SetMetadata(ROLES_KEY, roles);
