import { Module } from '@nestjs/common';
import { AppLoggerModule } from './app-logger/app-logger.module';
import { ShutdownModule } from './shutdown/shutdown.module';

@Module({
    imports: [AppLoggerModule, ShutdownModule],
    exports: [AppLoggerModule, ShutdownModule],
})
export class SharedModule { }
