import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TestModule } from './features/test/test.module';
import { FeaturesModule } from './features/features.module';
import { SharedModule } from './shared/shared.module';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { ShutdownModule } from './shared/shutdown/shutdown.module';
import { ShutdownService } from './shared/shutdown/shutdown.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    GracefulShutdownModule.forRootAsync({
      imports: [ShutdownModule],
      inject: [ShutdownService],
      useFactory: async (service: ShutdownService) => {
        await service.executeShutdownRoutines();
        return {
          gracefulShutdownTimeout: service.timeout,
        };
      }
    }),
    TestModule,
    FeaturesModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
