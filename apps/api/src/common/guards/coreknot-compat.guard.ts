import {
  CanActivate,
  ExecutionContext,
  GoneException,
  Injectable,
} from '@nestjs/common';
import { isPlatformCoreknotCompatEnabled } from '../config/platform-boundary.config';

/**
 * Blocks CoreKnot legacy route aliases on Platform API when compat is disabled.
 * CoreKnot Client must call api.coreknot.in — not Platform compat shims.
 */
@Injectable()
export class CoreknotCompatGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    if (isPlatformCoreknotCompatEnabled()) return true;

    throw new GoneException(
      'CoreKnot compat routes are disabled on Platform API. Use https://api.coreknot.in',
    );
  }
}
