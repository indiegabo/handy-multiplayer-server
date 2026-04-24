import { Module } from '@nestjs/common';
import { ShutdownService } from './shutdown.service';
import { BetterLoggerModule } from '@hms-module/modules/better-logger/better-logger.module';

@Module({
    imports: [BetterLoggerModule],
    exports: [ShutdownService],
    providers: [ShutdownService],
})
export class ShutdownModule { }
