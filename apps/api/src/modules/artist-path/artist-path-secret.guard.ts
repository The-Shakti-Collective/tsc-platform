import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ArtistPathSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.ARTIST_PATH_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('ARTIST_PATH_WEBHOOK_SECRET is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided =
      (request.headers['x-artist-path-secret'] as string | undefined)?.trim() ??
      (request.headers['x-webhook-secret'] as string | undefined)?.trim();

    if (!provided || provided !== secret) {
      throw new UnauthorizedException('Invalid artist path secret');
    }

    return true;
  }
}
