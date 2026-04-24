import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { SystemController } from './controllers/system.controller';
import { SystemGateway } from './system.gateway';
import { SystemService } from './services/system.service';
import { DockerModule } from '../docker/docker.module';
import { DiscordModule } from '../discord/discord.module';

@Module({
    imports: [
        DiscordModule,
        RedisModule,
        DockerModule,
    ],
    controllers: [SystemController],
    providers: [SystemService, SystemGateway],
    exports: [SystemService],
})
export class SystemModule { }
