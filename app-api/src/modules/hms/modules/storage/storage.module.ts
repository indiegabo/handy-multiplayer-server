import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageService } from './services/storage.service';
import { S3Client } from '@aws-sdk/client-s3';
import { BetterLoggerModule } from '../better-logger/better-logger.module';

@Module({
    imports: [
        ConfigModule,
        BetterLoggerModule,
    ],
    controllers: [],
    providers: [
        StorageService,
        {
            provide: 'S3_CLIENT',
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => new S3Client({
                region: configService.get('AWS_REGION'),
                credentials: {
                    accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
                    secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
                },
            }),
        },
        {
            provide: 'AWS_S3_BUCKET_NAME',
            useFactory: (configService: ConfigService) =>
                configService.get('AWS_S3_BUCKET_NAME'),
            inject: [ConfigService],
        },
    ],
    exports: [StorageService],
})
export class StorageModule { }