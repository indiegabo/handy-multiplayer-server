import { Game } from "@src/modules/sg/core/entities/game.entity";
import { GameAvailability } from "@src/sg/core/enums/game-availability.enum";
import { CONNECTION_MODULES_MOCK } from "./connection-modules.mock";
import { VERSIONS_MOCK } from "./versions.mock";

// Mock games
export const GAMES_MOCK: Game[] = [
    {
        id: '1c929c39-3651-4486-8677-dbf7fa1b12ca',
        name: 'Feed the blob!',
        description: 'Please, feed the blob before it is too late!',
        cover_url: 'https://streaming-games-dev.s3.sa-east-1.amazonaws.com/public/games/feed-the-blob.png',
        type: 1,
        availability: GameAvailability.Available,
        versions: [VERSIONS_MOCK[0], VERSIONS_MOCK[1]],
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: '1c929c39-3651-4486-8677-dbf7fa1b12cb',
        name: 'Humongous Snakes',
        description: 'They get big, they get HUMONGOUS',
        cover_url: 'https://streaming-games-dev.s3.sa-east-1.amazonaws.com/public/games/humongous-snakes.png',
        type: 1,
        availability: GameAvailability.ComingSoon,
        versions: [],
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: '1c929c39-3651-4486-8677-dbf7fa1b12cc',
        name: 'Run for your life',
        description: 'Keep running, keep running!!!!!',
        cover_url: 'https://streaming-games-dev.s3.sa-east-1.amazonaws.com/public/games/run-for-your-life.png',
        type: 2,
        availability: GameAvailability.ComingSoon,
        versions: [],
        created_at: new Date(),
        updated_at: new Date(),
    }
];

// Update the game references in versions
VERSIONS_MOCK[0].game = GAMES_MOCK[0];
VERSIONS_MOCK[1].game = GAMES_MOCK[0];