import { Module } from '@nestjs/common';
import {
    HMS_I18N_CONFIG,
    HMS_I18N_CONFIG_TOKEN,
} from '@src/config/hms/i18n.config';
import { FilesystemModule }
    from '@hms-module/modules/filesystem/filesystem.module';
import { I18nController } from './controllers/i18n.controller';
import { I18nService } from './services/i18n.service';

@Module({
    imports: [FilesystemModule],
    controllers: [I18nController],
    providers: [
        I18nService,
        {
            provide: HMS_I18N_CONFIG_TOKEN,
            useValue: HMS_I18N_CONFIG,
        },
    ],
    exports: [I18nService],
})
export class I18nModule { }
