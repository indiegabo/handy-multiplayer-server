import { Module } from '@nestjs/common';
import { TemplateEngineService } from './template-engine.service';
import { BetterLoggerModule } from '../better-logger/better-logger.module';

@Module({
    imports: [
        BetterLoggerModule,
    ],
    providers: [TemplateEngineService],
    exports: [TemplateEngineService],
})
export class TemplateEngineModule { }
