import { Test, TestingModule } from '@nestjs/testing';

import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { ConnectionPlatform } from '@hms/shared-types';

import { GamesBackofficeController } from '@src/modules/sg/modules/games/modules/backoffice/controllers/games-backoffice.controller';
import { CrowdActionsFacade } from '@src/modules/sg/modules/games/modules/backoffice/facades/crowd-actions.facade';
import { GamesFacade } from '@src/modules/sg/modules/games/modules/backoffice/facades/games.facade';
import { ManagementTokensFacade } from '@src/modules/sg/modules/games/modules/backoffice/facades/management-tokens.facade';
import { VersionsFacade } from '@src/modules/sg/modules/games/modules/backoffice/facades/versions.facade';
import { RemoveGameImageUseCase } from '@src/modules/sg/modules/games/modules/backoffice/use-cases/games/remove-game-image.usecase';
import { RequestGamePurgeUseCase } from '@src/modules/sg/modules/games/modules/backoffice/use-cases/games/request-game-purge.usecase';
import { UploadGameImageUseCase } from '@src/modules/sg/modules/games/modules/backoffice/use-cases/games/upload-game-image.usecase';
import { FilterVersionsUseCase } from '@src/modules/sg/core/use-cases/versions/filter-versions.usecase';

import { BetterLoggerServiceMock } from 'test/mocks/core/services/better-logger.service.mock';

describe('GamesBackofficeController', () => {
    let controller: GamesBackofficeController;
    let gamesFacade: jest.Mocked<GamesFacade>;
    let versionsFacade: jest.Mocked<VersionsFacade>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GamesBackofficeController],
            providers: [
                {
                    provide: GamesFacade,
                    useValue: {
                        getGameById: jest.fn(),
                    },
                },
                {
                    provide: VersionsFacade,
                    useValue: {
                        getVersionRuntimePlatforms: jest.fn(),
                        getVersionRuntimeInitSettings: jest.fn(),
                        setVersionRuntimeInitSettings: jest.fn(),
                    },
                },
                {
                    provide: ManagementTokensFacade,
                    useValue: {},
                },
                {
                    provide: CrowdActionsFacade,
                    useValue: {},
                },
                {
                    provide: FilterVersionsUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: UploadGameImageUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: RemoveGameImageUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: RequestGamePurgeUseCase,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: BetterLogger,
                    useClass: BetterLoggerServiceMock,
                },
            ],
        }).compile();

        controller = module.get<GamesBackofficeController>(GamesBackofficeController);
        gamesFacade = module.get(GamesFacade);
        versionsFacade = module.get(VersionsFacade);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return version platforms and validate game exists', async () => {
        const gameId = '11111111-1111-4111-8111-111111111111';
        const versionId = '22222222-2222-4222-8222-222222222222';
        const platforms = [ConnectionPlatform.Twitch, ConnectionPlatform.Youtube];

        gamesFacade.getGameById.mockResolvedValue({ id: gameId } as any);
        versionsFacade.getVersionRuntimePlatforms.mockResolvedValue(platforms);

        const result = await controller.getVersionPlatforms(gameId, versionId);

        expect(gamesFacade.getGameById).toHaveBeenCalledWith(gameId);
        expect(versionsFacade.getVersionRuntimePlatforms).toHaveBeenCalledWith(versionId);
        expect(result.data).toEqual(platforms);
    });

    it('should update version init settings', async () => {
        const gameId = '11111111-1111-4111-8111-111111111111';
        const versionId = '22222222-2222-4222-8222-222222222222';
        const initSettings = [
            {
                metadata: {
                    id: 'default',
                    order: 1,
                    display_name: 'Default',
                },
                fields: {
                    max_players: 4,
                },
            },
        ];

        versionsFacade.setVersionRuntimeInitSettings.mockResolvedValue({
            version_id: versionId,
            init_settings: initSettings,
        } as any);

        const result = await controller.updateVersionInitSettings(
            gameId,
            versionId,
            { init_settings: initSettings } as any,
        );

        expect(
            versionsFacade.setVersionRuntimeInitSettings,
        ).toHaveBeenCalledWith(
            gameId,
            versionId,
            initSettings,
        );
        expect(result.data).toEqual({
            version_id: versionId,
            init_settings: initSettings,
        });
    });

    it('should return version init settings and validate game exists', async () => {
        const gameId = '11111111-1111-4111-8111-111111111111';
        const versionId = '22222222-2222-4222-8222-222222222222';
        const initSettings = [
            {
                metadata: {
                    id: 'default',
                    order: 1,
                    display_name: 'Default',
                },
                fields: {
                    max_players: 4,
                },
            },
        ];

        gamesFacade.getGameById.mockResolvedValue({ id: gameId } as any);
        versionsFacade.getVersionRuntimeInitSettings.mockResolvedValue(
            initSettings as any,
        );

        const result = await controller.getVersionInitSettings(gameId, versionId);

        expect(gamesFacade.getGameById).toHaveBeenCalledWith(gameId);
        expect(
            versionsFacade.getVersionRuntimeInitSettings,
        ).toHaveBeenCalledWith(versionId);
        expect(result.data).toEqual(initSettings);
    });
});
