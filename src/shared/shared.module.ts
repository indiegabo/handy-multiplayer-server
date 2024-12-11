import { Module } from '@nestjs/common';
import { AppLoggerModule } from './app-logger/app-logger.module';

@Module({
    imports: [AppLoggerModule],
    exports: [AppLoggerModule],
})
export class SharedModule { }
