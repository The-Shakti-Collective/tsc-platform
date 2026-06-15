import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class WebsiteContactSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.WEBSITE_CONTACT_SECRET?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('WEBSITE_CONTACT_SECRET is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided =
      (request.headers['x-website-contact-secret'] as string | undefined)?.trim() ??
      (request.headers['x-tsc-website-contact-secret'] as string | undefined)?.trim();

    if (!provided || provided !== secret) {
      throw new UnauthorizedException('Invalid website contact secret');
    }

    return true;
  }
}
