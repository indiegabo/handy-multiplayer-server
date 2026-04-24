import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GetVersionUnderDevelopmentUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/versions/get-version-under-development.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { GameVersionState } from '@hms/shared-types';

describe('GetVersionUnderDevelopmentUseCase', () => {
    let useCase: GetVersionUnderDevelopmentUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let gameRepository: jest.Mocked<GameRepository>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetVersionUnderDevelopmentUseCase,
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

        useCase = module.get<GetVersionUnderDevelopmentUseCase>(
            GetVersionUnderDevelopmentUseCase,
        );
        versionRepository = module.get(VersionRepository);
        gameRepository = module.get(GameRepository);
        logger = module.get(BetterLogger);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    it('should return version under development when found', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.1.0', major: 1, minor: 1, patch: 0 },
            state: GameVersionState.UnderDevelopment,
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

    it('should throw NotFoundException when no version under development exists', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockResolvedValue(null);

        await expect(useCase.execute('game-id')).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw BadRequestException when an unexpected error occurs', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockRejectedValue(
            new Error('Database connection error'),
        );

        await expect(useCase.execute('game-id')).rejects.toThrow(
            BadRequestException,
        );
    });

    it('should call gameRepository.findOne with correct parameters', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.1.0', major: 1, minor: 1, patch: 0 },
            state: GameVersionState.UnderDevelopment,
            is_current: false,
            is_prerelease: false,
            notes: { en: 'New features' },
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockResolvedValue(mockVersion as any);

        await useCase.execute('game-id');

        expect(gameRepository.findOne).toHaveBeenCalledWith({
            where: { id: 'game-id' },
        });
    });

    it('should call versionRepository.findOne with correct parameters', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.1.0', major: 1, minor: 1, patch: 0 },
            state: GameVersionState.UnderDevelopment,
            is_current: false,
            is_prerelease: false,
            notes: { en: 'New features' },
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockResolvedValue(mockVersion as any);

        await useCase.execute('game-id');

        expect(versionRepository.findOne).toHaveBeenCalledWith({
            where: {
                entity_type: 'Game',
                entity_id: 'game-id',
                state: GameVersionState.UnderDevelopment,
            },
        });
    });
});
