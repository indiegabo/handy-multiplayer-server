import { Module } from "@nestjs/common";
import { RedisModule } from "./modules/redis/redis.module";
import { DiscordModule } from "./modules/discord/discord.module";
import { SystemModule } from "./modules/system/system.module";

@Module({
    imports: [
        SystemModule,
        RedisModule,
        DiscordModule,
    ],
    exports: [
        SystemModule,
        RedisModule,
        DiscordModule,
    ],
})
export class HMSModule { }
