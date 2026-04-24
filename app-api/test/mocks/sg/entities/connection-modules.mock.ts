import { ConnectionModule } from "@src/modules/sg/core/entities/connection-module.entity";
import { ConnectionPlatform } from "@src/modules/sg/core/enums/connection-platform.enum";

// Mock connection modules

export const CONNECTION_MODULES_MOCK: ConnectionModule[] = [
    {
        id: 'module-1',
        name: 'Twitch',
        platform: ConnectionPlatform.Twitch,
        description: 'Twitch Module',
        supported_games: [],
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: 'module-2',
        name: 'Youtube',
        platform: ConnectionPlatform.Youtube,
        description: 'Youtube Module',
        supported_games: [],
        created_at: new Date(),
        updated_at: new Date(),
    }
];
