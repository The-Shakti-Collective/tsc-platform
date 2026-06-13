import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/** Relative Swagger segment; combined with global prefix → `/api/docs`. */
export const SWAGGER_UI_PATH = 'docs';

const API_TITLE = 'TSC API';
const API_DESCRIPTION =
  'The Shakti Collective platform API — identity, community, marketplace, workspace, and intelligence services.';

export function resolveApiGlobalPrefix(): string {
  return process.env.API_GLOBAL_PREFIX ?? 'api';
}

export function resolveSwaggerUiPath(prefix = resolveApiGlobalPrefix()): string {
  return `/${prefix}/${SWAGGER_UI_PATH}`;
}

export function resolveSwaggerJsonPath(prefix = resolveApiGlobalPrefix()): string {
  return `/${prefix}/${SWAGGER_UI_PATH}-json`;
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const prefix = resolveApiGlobalPrefix();
  const port = Number(process.env.PORT ?? 4000);

  const config = new DocumentBuilder()
    .setTitle(API_TITLE)
    .setDescription(API_DESCRIPTION)
    .setVersion(process.env.npm_package_version ?? '0.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk session token (Authorization: Bearer <token>)',
      },
      'bearer',
    )
    .addServer(`http://localhost:${port}/${prefix}`, 'Local development')
    .addServer('https://api.theshakticollective.in', 'Production')
    .addServer('https://api-staging.theshakticollective.in', 'Staging')
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): OpenAPIObject {
  const document = createOpenApiDocument(app);

  SwaggerModule.setup(SWAGGER_UI_PATH, app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: `${SWAGGER_UI_PATH}-json`,
  });

  return document;
}

export function resolveOpenApiExportPath(): string {
  return (
    process.env.OPENAPI_EXPORT_PATH?.trim() ||
    resolve(process.cwd(), 'openapi', 'tsc-api.openapi.json')
  );
}

export function exportOpenApiDocument(
  app: INestApplication,
  outputPath = resolveOpenApiExportPath(),
): string {
  const document = createOpenApiDocument(app);
  const absolutePath = resolve(outputPath);

  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(document, null, 2)}\n`, 'utf-8');

  return absolutePath;
}
