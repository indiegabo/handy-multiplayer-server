import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    // API versioning via URI prefix "v"
    app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
      defaultVersion: '1',
    });

    // Swagger/OpenAPI setup
    const config = new DocumentBuilder()
      .setTitle('Streaming Games - System API')
      .setDescription('System service endpoints (infrastructure/internal ops)')
      .setVersion('1.0')
      .addBearerAuth() // Align with controllers that may require auth
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'SG System Docs',
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);

    logger.log(`✅  System service successfully running on port ${port}`);
    logger.log(`📑  Swagger docs available at http://localhost:${port}/docs`);
  } catch (error) {
    logger.error('❌  Failed to start system service', error);
    process.exit(1);
  }
}

bootstrap();
