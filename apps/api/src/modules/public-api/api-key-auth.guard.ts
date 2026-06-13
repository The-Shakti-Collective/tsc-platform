import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ApiScopeValue } from '@tsc/database';
import { API_KEY_HEADER } from '@tsc/database';
import { ApiKeyAuthService, type ValidatedApiKey } from './api-key-auth.service';

export const API_SCOPE_KEY = 'tsc:api-scope';

export const RequireApiScope = (scope: ApiScopeValue) => SetMetadata(API_SCOPE_KEY, scope);

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly authService: ApiKeyAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      apiKey?: ValidatedApiKey;
    }>();

    const requiredScope = this.reflector.getAllAndOverride<ApiScopeValue | undefined>(
      API_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const header =
      request.headers[API_KEY_HEADER] ??
      request.headers[API_KEY_HEADER.toUpperCase()];

    const rawHeader = Array.isArray(header) ? header[0] : header;
    request.apiKey = await this.authService.validateHeader(rawHeader, requiredScope);
    return true;
  }
}
