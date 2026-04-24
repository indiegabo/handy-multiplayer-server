// src/app.module.ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";
import { TerminusModule } from "@nestjs/terminus";
import { APP_INTERCEPTOR } from "@nestjs/core";

import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

import { GracefulShutdownModule } from "nestjs-graceful-shutdown";
import { TestingModule } from "./testing/testing.module";
import { StaticAdminPanelModule } from "./modules/admin-panel/static-admin-panel.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DB_CONFIG, MONGO_ENABLED, mongooseRootFactory } from "./config/hms/database.config";
import { HMSModule } from "./modules/hms/hms.module";
import { ApiResponseInterceptor } from "./modules/hms/core/api/api-response.interceptor";
import { DeviceMiddleware } from "./modules/hms/core/middlewares/device.middleware";
import { CorsMiddleware } from "./modules/hms/core/middlewares/cors.middleware";

/**
 * AppModule composes infrastructure, platform modules and cross-cutting config.
 * StaticAdminPanelModule handles the Angular SPA under /admin-panel/**.
 *
 * MongoDB connection is optional and controlled by DB_GAME_ENABLED.
 * When disabled, no Mongoose connection is established and no overhead occurs.
 */
@Module({
  imports: [
    // ---------------------------------------------------------------------
    // Configuration & Core Infra
    // ---------------------------------------------------------------------
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    GracefulShutdownModule.forRootAsync({
      useFactory: async () => ({ gracefulShutdownTimeout: 10_000 }),
    }),

    // ---------------------------------------------------------------------
    // Databases
    // ---------------------------------------------------------------------
    TypeOrmModule.forRoot(DB_CONFIG.sources.main.options),

    // MongoDB only when explicitly enabled (no connection otherwise).
    ...(MONGO_ENABLED
      ? [
        MongooseModule.forRootAsync({
          useFactory: () => mongooseRootFactory(),
        }),
      ]
      : []),

    // ---------------------------------------------------------------------
    // File Uploads (S3)
    // ---------------------------------------------------------------------
    MulterModule.registerAsync({
      useFactory: () => ({
        storage: multerS3({
          s3: new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          }),
          bucket: process.env.AWS_S3_BUCKET_NAME,
          acl: "public-read",
          key: (req, file, cb) => {
            const ext = file.originalname.split(".").pop();
            const filename = `${Date.now()}.${ext}`;
            cb(null, filename);
          },
        }),
      }),
    }),

    // ---------------------------------------------------------------------
    // Health & Ops
    // ---------------------------------------------------------------------
    TerminusModule,

    // ---------------------------------------------------------------------
    // Feature Modules
    // ---------------------------------------------------------------------
    HMSModule,
    TestingModule,

    // ---------------------------------------------------------------------
    // Static Admin SPA at /admin-panel/**
    // ---------------------------------------------------------------------
    StaticAdminPanelModule.register(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Applies CORS and device detection to all application routes.
   * Uses a named wildcard (:path*) to comply with path-to-regexp v6.
   *
   * @param consumer Middleware consumer instance.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorsMiddleware, DeviceMiddleware)
      .forRoutes({ path: "*path", method: RequestMethod.ALL });
  }
}
