import { Module } from "@nestjs/common";
import { BetterLoggerModule } from "../better-logger/better-logger.module";
import { AppSetupService } from "./app-setup.service";
import { AppSetupController } from "./app-setup.controller";
import { UsersModule } from "../users/users.module";
import { RedisModule } from "../redis/redis.module";
import { MailModule } from "../mail/mail.module";
import { AppSetup } from "./entities/app-setup.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [
        BetterLoggerModule,
        UsersModule,
        RedisModule,
        MailModule,
        AuthModule,
        TypeOrmModule.forFeature([AppSetup]),
    ],
    controllers: [AppSetupController],
    providers: [AppSetupService],
    exports: [],
})
export class AppSetupModule { }