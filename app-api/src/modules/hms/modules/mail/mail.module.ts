import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { BetterLoggerModule } from '../better-logger/better-logger.module';
import { TemplateEngineModule } from '../template-engine/template-engine.module';

@Module({
    imports: [
        BetterLoggerModule,
        TemplateEngineModule,
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }