import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import {
  exportOpenApiDocument,
  resolveApiGlobalPrefix,
  resolveOpenApiExportPath,
} from './swagger/swagger.setup';

async function generateOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const prefix = resolveApiGlobalPrefix();
  app.setGlobalPrefix(prefix);

  const outputPath = exportOpenApiDocument(app, resolveOpenApiExportPath());

  await app.close();

  console.log(`OpenAPI spec written to ${outputPath}`);
}

generateOpenApi().catch((error: unknown) => {
  console.error('Failed to export OpenAPI spec:', error);
  process.exit(1);
});
