import { afterEach, describe, expect, it } from 'vitest';

import {
  resolveApiGlobalPrefix,
  resolveSwaggerJsonPath,
  resolveSwaggerUiPath,
} from './swagger.setup';

describe('swagger.setup path helpers', () => {
  const originalPrefix = process.env.API_GLOBAL_PREFIX;

  afterEach(() => {
    if (originalPrefix === undefined) {
      delete process.env.API_GLOBAL_PREFIX;
    } else {
      process.env.API_GLOBAL_PREFIX = originalPrefix;
    }
  });

  it('defaults global prefix to api', () => {
    delete process.env.API_GLOBAL_PREFIX;
    expect(resolveApiGlobalPrefix()).toBe('api');
  });

  it('resolves Swagger UI under global prefix', () => {
    expect(resolveSwaggerUiPath()).toBe('/api/docs');
    expect(resolveSwaggerUiPath('v1')).toBe('/v1/docs');
  });

  it('resolves OpenAPI JSON under global prefix', () => {
    expect(resolveSwaggerJsonPath()).toBe('/api/docs-json');
    expect(resolveSwaggerJsonPath('v1')).toBe('/v1/docs-json');
  });
});
