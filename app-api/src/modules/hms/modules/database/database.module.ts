import { Module } from '@nestjs/common';
import { SeedingService } from './seeding.service';
import { BetterLoggerModule } from '@hms-module/modules/better-logger/better-logger.module';
import { MigrationService } from './migration.service';

@Module({
    imports: [
        BetterLoggerModule,
    ],
    controllers: [],
    providers: [SeedingService, MigrationService,],
    exports: [SeedingService, MigrationService,],
})
export class DatabaseModule { }