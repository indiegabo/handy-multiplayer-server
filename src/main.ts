import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  setupGracefulShutdown({ app });
  await app.listen(process.env.NEST_PORT ?? 3000);
}
bootstrap();
