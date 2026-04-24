import { Module } from "@nestjs/common";
import { DiscordService } from "./services/discord.service";
import { SystemModule } from "../system/system.module";

@Module({
    imports: [
    ],
    controllers: [],
    providers: [DiscordService],
    exports: [DiscordService],
})
export class DiscordModule { }
