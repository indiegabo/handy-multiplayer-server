import { Module } from "@nestjs/common";
import { RedisModule } from "./modules/redis/redis.module";
import { StorageModule } from "./modules/storage/storage.module";
import { LifeCycleModule } from "./modules/life-cycle/life-cycle.module";
import { BetterLoggerModule } from "./modules/better-logger/better-logger.module";
import { MailModule } from "./modules/mail/mail.module";
import { OneTimeTokensModule } from "./modules/one-time-tokens/one-time-tokens.module";
import { GenericValidationsModule } from "./modules/generic-validations/generic-validations.module";
import { GameInstancesModule } from "./modules/game-instances/game-instances.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ScopedTokensModule } from "./modules/scoped-tokens/scoped-tokens.module";
import { AppSetupModule } from "./modules/app-setup/app-setup.module";
import { TemplateEngineModule } from "./modules/template-engine/template-engine.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DatabaseModule } from "./modules/database/database.module";
import { SecurityModule } from "./modules/security/security.module";
import { MediaModule } from "./modules/media/media.module";
import { FilesystemModule } from "./modules/filesystem/filesystem.module";
import { I18nModule } from "./modules/i18n/i18n.module";

@Module({
    imports: [
        AppSetupModule,
        RedisModule,
        StorageModule,
        FilesystemModule,
        I18nModule,
        LifeCycleModule,
        MailModule,
        BetterLoggerModule,
        OneTimeTokensModule,
        GenericValidationsModule,
        GameInstancesModule,
        AuthModule,
        UsersModule,
        BetterLoggerModule,
        OneTimeTokensModule,
        ScopedTokensModule,
        TemplateEngineModule,
        NotificationsModule,
        DatabaseModule,
        SecurityModule,
        MediaModule,
    ],
    exports: [
        AppSetupModule,
        RedisModule,
        StorageModule,
        FilesystemModule,
        I18nModule,
        LifeCycleModule,
        MailModule,
        BetterLoggerModule,
        OneTimeTokensModule,
        GenericValidationsModule,
        GameInstancesModule,
        AuthModule,
        UsersModule,
        BetterLoggerModule,
        OneTimeTokensModule,
        ScopedTokensModule,
        TemplateEngineModule,
        NotificationsModule,
        DatabaseModule,
        MediaModule,
    ],
})
export class HMSModule { }
