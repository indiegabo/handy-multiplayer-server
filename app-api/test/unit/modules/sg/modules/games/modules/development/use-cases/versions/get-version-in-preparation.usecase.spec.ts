import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GetVersionInPreparationUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/versions/get-version-in-preparation.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { GameVersionState } from '@hms/shared-types';

describe('GetVersionInPreparationUseCase', () => {
    let useCase: GetVersionInPreparationUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let gameRepository: jest.Mocked<GameRepository>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetVersionInPreparationUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: GameRepository,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: BetterLogger,
                    useValue: {
                        setContext: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<GetVersionInPreparationUseCase>(
            GetVersionInPreparationUseCase,
        );
        versionRepository = module.get(VersionRepository);
        gameRepository = module.get(GameRepository);
        logger = module.get(BetterLogger);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    it('should return version in preparation when found', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.1.0', major: 1, minor: 1, patch: 0 },
            state: GameVersionState.AwaitingDevelopmentApproval,
            is_current: false,
            is_prerelease: false,
            notes: { en: 'New features' },
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockResolvedValue(mockVersion as any);

        const result = await useCase.execute('game-id');

        expect(result).toEqual({
            id: mockVersion.id,
            semver: mockVersion.semver,
            state: mockVersion.state,
            is_current: mockVersion.is_current,
            is_prerelease: mockVersion.is_prerelease,
            release_notes: mockVersion.notes,
        });
    });

    it('should throw NotFoundException when game does not exist', async () => {
        gameRepository.findOne.mockResolvedValue(null);

        await expect(useCase.execute('game-id')).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw NotFoundException when no version in preparation exists', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockResolvedValue(null);

        await expect(useCase.execute('game-id')).rejects.toThrow(
            NotFoundException,
        );
    });
});
