import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GetCurrentVersionUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/versions/get-current-version.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { GameVersionState } from '@hms/shared-types';

describe('GetCurrentVersionUseCase', () => {
    let useCase: GetCurrentVersionUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetCurrentVersionUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findCurrent: jest.fn(),
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

        useCase = module.get<GetCurrentVersionUseCase>(GetCurrentVersionUseCase);
        versionRepository = module.get(VersionRepository);
        logger = module.get(BetterLogger);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    it('should return current version when found', async () => {
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.0.0', major: 1, minor: 0, patch: 0 },
            state: GameVersionState.Released,
            is_current: true,
            is_prerelease: false,
            notes: { en: 'Release notes' },
        };

        versionRepository.findCurrent.mockResolvedValue(mockVersion as any);

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

    it('should throw NotFoundException when no current version exists', async () => {
        versionRepository.findCurrent.mockResolvedValue(null);

        await expect(useCase.execute('game-id')).rejects.toThrow(
            NotFoundException,
        );
    });
});
