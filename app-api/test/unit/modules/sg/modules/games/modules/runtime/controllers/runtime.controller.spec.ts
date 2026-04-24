import { Test, TestingModule } from '@nestjs/testing';
import {
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import {
    GameAvailability,
    VersionInitSettingsPage,
} from '@hms/shared-types';

import { RuntimeController } from '@src/modules/sg/modules/games/modules/runtime/controllers/runtime.controller';
import { RuntimeFacade } from '@src/modules/sg/modules/games/modules/runtime/facades/runtime.facade';
import { GamesService } from '@src/modules/sg/modules/games/modules/public/services/games.service';

describe('RuntimeController', () => {
    let controller: RuntimeController;
    let runtimeFacade: jest.Mocked<RuntimeFacade>;
    let gamesService: jest.Mocked<GamesService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RuntimeController],
            providers: [
                {
                    provide: RuntimeFacade,
                    useValue: {
                        getVersionInitSettings: jest.fn(),
                    },
                },
                {
                    provide: GamesService,
                    useValue: {
                        getGameById: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<RuntimeController>(RuntimeController);
        runtimeFacade = module.get(RuntimeFacade);
        gamesService = module.get(GamesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return version init settings for allowed game availability', async () => {
        const gameId = '11111111-1111-4111-8111-111111111111';
        const versionId = '22222222-2222-4222-8222-222222222222';

        const initSettings: VersionInitSettingsPage[] = [
            {
                metadata: {
                    id: 'window',
                    order: 1,
                    display_name: 'Window',
                },
                fields: {
                    background: true,
                    monitorIndex: 1,
                },
            },
        ];

        gamesService.getGameById.mockResolvedValue({
            id: gameId,
            availability: GameAvailability.Available,
        } as any);

        runtimeFacade.getVersionInitSettings.mockResolvedValue(initSettings);

        const result = await controller.getVersionInitSettings(gameId, versionId);

        expect(gamesService.getGameById).toHaveBeenCalledWith(gameId);
        expect(runtimeFacade.getVersionInitSettings).toHaveBeenCalledWith(
            gameId,
            versionId,
        );
        expect(result.data).toEqual(initSettings);
    });

    it('should throw NotFoundException when game does not exist', async () => {
        const gameId = '11111111-1111-4111-8111-111111111111';
        const versionId = '22222222-2222-4222-8222-222222222222';

        gamesService.getGameById.mockResolvedValue(null);

        await expect(
            controller.getVersionInitSettings(gameId, versionId),
        ).rejects.toThrow(NotFoundException);

        expect(runtimeFacade.getVersionInitSettings).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for disallowed game availability', async () => {
        const gameId = '11111111-1111-4111-8111-111111111111';
        const versionId = '22222222-2222-4222-8222-222222222222';

        gamesService.getGameById.mockResolvedValue({
            id: gameId,
            availability: GameAvailability.Unlisted,
        } as any);

        await expect(
            controller.getVersionInitSettings(gameId, versionId),
        ).rejects.toThrow(ForbiddenException);

        expect(runtimeFacade.getVersionInitSettings).not.toHaveBeenCalled();
    });
});
