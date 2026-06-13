import './load-env';
import 'reflect-metadata';
import { bootstrapSentry } from './sentry.bootstrap';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  exportOpenApiDocument,
  resolveApiGlobalPrefix,
  resolveSwaggerJsonPath,
  resolveSwaggerUiPath,
  setupSwagger,
} from './swagger/swagger.setup';

bootstrapSentry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prefix = resolveApiGlobalPrefix();
  app.setGlobalPrefix(prefix);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  setupSwagger(app);

  if (process.env.OPENAPI_EXPORT_ON_BOOT === 'true') {
    const outputPath = exportOpenApiDocument(app);
    console.log(`OpenAPI spec exported to ${outputPath}`);
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`TSC API listening on http://0.0.0.0:${port}/${prefix}`);
  console.log(`Swagger UI at http://0.0.0.0:${port}${resolveSwaggerUiPath(prefix)}`);
  console.log(`OpenAPI JSON at http://0.0.0.0:${port}${resolveSwaggerJsonPath(prefix)}`);
}

bootstrap();
