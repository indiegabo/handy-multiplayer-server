import { Module } from '@nestjs/common';
import { ShutdownService } from './shutdown.service';
import { AppLoggerModule } from '../app-logger/app-logger.module';

@Module({
    imports: [AppLoggerModule],
    exports: [ShutdownService],
    providers: [ShutdownService],
})
export class ShutdownModule { }
