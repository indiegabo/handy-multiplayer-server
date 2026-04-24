import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { CancelVersionInPreparationUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/versions/cancel-version-in-preparation.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { BuildRepository } from '@src/modules/sg/core/repositories/build.repository';
import { StorageService } from '@hms-module/modules/storage/services/storage.service';
import { GameVersionState } from '@hms/shared-types';
import { DataSource, QueryRunner } from 'typeorm';

describe('CancelVersionInPreparationUseCase', () => {
    let useCase: CancelVersionInPreparationUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let gameRepository: jest.Mocked<GameRepository>;
    let buildRepository: jest.Mocked<BuildRepository>;
    let storageService: jest.Mocked<StorageService>;
    let dataSource: jest.Mocked<DataSource>;
    let queryRunner: jest.Mocked<QueryRunner>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(async () => {
        queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn().mockResolvedValue(undefined),
            release: jest.fn(),
            manager: {},
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CancelVersionInPreparationUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findOne: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: GameRepository,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: BuildRepository,
                    useValue: {
                        delete: jest.fn(),
                    },
                },
                {
                    provide: StorageService,
                    useValue: {
                        deleteZipAndMeta: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: jest.fn(() => queryRunner),
                    },
                },
                {
                    provide: BetterLogger,
                    useValue: {
                        setContext: jest.fn(),
                        log: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<CancelVersionInPreparationUseCase>(
            CancelVersionInPreparationUseCase,
        );
        versionRepository = module.get(VersionRepository);
        gameRepository = module.get(GameRepository);
        buildRepository = module.get(BuildRepository);
        storageService = module.get(StorageService);
        dataSource = module.get(DataSource);
        logger = module.get(BetterLogger);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    it('should throw NotFoundException when game does not exist', async () => {
        gameRepository.findOne.mockResolvedValue(null);

        await expect(useCase.execute('game-id')).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should complete successfully when no version in preparation exists', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockResolvedValue(null);

        await expect(useCase.execute('game-id')).resolves.toBeUndefined();
    });

    it('should delete version and builds when version in preparation exists', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockBuilds = [
            { id: 'build-1', src: 'path/to/build1.zip' },
            { id: 'build-2', src: 'path/to/build2.zip' },
        ];
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.1.0' },
            state: GameVersionState.AwaitingDevelopmentApproval,
            builds: mockBuilds,
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        versionRepository.findOne.mockResolvedValue(mockVersion as any);
        storageService.deleteZipAndMeta.mockResolvedValue(undefined);

        await useCase.execute('game-id');

        expect(storageService.deleteZipAndMeta).toHaveBeenCalledTimes(2);
        expect(buildRepository.delete).toHaveBeenCalledWith(['build-1', 'build-2']);
        expect(versionRepository.delete).toHaveBeenCalledWith('version-id');
    });
});
