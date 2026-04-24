import 'reflect-metadata';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';
import { GlobalExceptionFilter } from './global-exception.filter';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { Logger, VersioningType } from '@nestjs/common';
import { InitService } from '@hms-module/modules/life-cycle/init/init.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    // Enable graceful shutdown
    app.enableShutdownHooks();
    setupGracefulShutdown({ app });

    // Setup global exception filter
    const filterLogger = await app.resolve(BetterLogger);
    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost, filterLogger));

    // Initialize application (InitService + @InitStep pipeline)
    const initService = app.get(InitService);
    const initSuccess = await initService.init();

    if (!initSuccess) {
      logger.error('Application initialization failed - shutting down');
      process.exit(1);
    }

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('Streaming Games - Backoffice API')
      .setDescription('Administrative endpoints for Games backoffice')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'SG Backoffice Docs',
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`✅  Application successfully running on port ${port}`);
    logger.log(`📑  Swagger docs available at http://localhost:${port}/docs`);
  } catch (error) {
    logger.error('❌  Failed to start application', error);
    process.exit(1);
  }
}
bootstrap();
