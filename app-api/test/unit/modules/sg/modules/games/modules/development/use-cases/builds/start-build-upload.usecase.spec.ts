import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { StartBuildUploadUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/builds/start-build-upload.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { BuildRepository } from '@src/modules/sg/core/repositories/build.repository';
import { StorageService } from '@hms-module/modules/storage/services/storage.service';
import { RedisService } from '@hms-module/modules/redis/redis.service';
import { DataSource, QueryRunner } from 'typeorm';
import { GameBuildState } from '@src/modules/sg/core/enums/game-build-state.enum';
import { FileHost } from '@src/modules/sg/core/enums/file-host.enum';
import { GameBuildPlatform } from '@hms/shared-types';

describe('StartBuildUploadUseCase', () => {
    let useCase: StartBuildUploadUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let gameRepository: jest.Mocked<GameRepository>;
    let buildRepository: jest.Mocked<BuildRepository>;
    let storageService: jest.Mocked<StorageService>;
    let redisService: jest.Mocked<RedisService>;
    let dataSource: jest.Mocked<DataSource>;
    let queryRunner: jest.Mocked<QueryRunner>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(async () => {
        queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                save: jest.fn(),
            },
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StartBuildUploadUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        createQueryBuilder: jest.fn(() => ({
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            getOne: jest.fn(),
                        })),
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
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: StorageService,
                    useValue: {
                        generateUploadPreSignedUrl: jest.fn(),
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        set: jest.fn(),
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
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<StartBuildUploadUseCase>(StartBuildUploadUseCase);
        versionRepository = module.get(VersionRepository);
        gameRepository = module.get(GameRepository);
        buildRepository = module.get(BuildRepository);
        storageService = module.get(StorageService);
        redisService = module.get(RedisService);
        dataSource = module.get(DataSource);
        logger = module.get(BetterLogger);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    it('should throw NotFoundException when game does not exist', async () => {
        gameRepository.findOne.mockResolvedValue(null);

        const payload = {
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
            host: FileHost.S3,
            filename: 'game-build.zip',
            executable_name: 'game.exe',
            download_size: 1024000,
            installed_size: 2048000,
            override_existing: false,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw NotFoundException when version does not exist', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };

        gameRepository.findOne.mockResolvedValue(mockGame as any);

        const queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
        };

        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(
            queryBuilder,
        );

        const payload = {
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
            host: FileHost.S3,
            filename: 'game-build.zip',
            executable_name: 'game.exe',
            download_size: 1024000,
            installed_size: 2048000,
            override_existing: false,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw ConflictException when build exists and override is false', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.0.0' },
            meta: {
                acknowledgment: { acknowledged: true },
            },
        };
        const mockExistingBuild = {
            id: 'build-id',
            state: GameBuildState.Active,
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);

        const queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockVersion),
        };

        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(
            queryBuilder,
        );

        buildRepository.findOne.mockResolvedValue(mockExistingBuild as any);

        const payload = {
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
            host: FileHost.S3,
            filename: 'game-build.zip',
            executable_name: 'game.exe',
            download_size: 1024000,
            installed_size: 2048000,
            override_existing: false,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            ConflictException,
        );
    });

    it('should throw ConflictException if version is not acknowledged for development', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        // meta ausente
        const mockVersionNoMeta = {
            id: 'version-id',
            semver: { raw: '1.0.0' },
        };
        // acknowledgment ausente
        const mockVersionNoAck = {
            id: 'version-id',
            semver: { raw: '1.0.0' },
            meta: {},
        };
        // acknowledgment.acknowledged = false
        const mockVersionNotAck = {
            id: 'version-id',
            semver: { raw: '1.0.0' },
            meta: {
                acknowledgment: { acknowledged: false },
            },
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        const payload = {
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
            host: FileHost.S3,
            filename: 'game-build.zip',
            executable_name: 'game.exe',
            download_size: 1024000,
            installed_size: 2048000,
            override_existing: false,
        };

        // meta ausente
        let queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockVersionNoMeta),
        };
        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);
        await expect(useCase.execute('game-id', payload)).rejects.toThrow(ConflictException);

        // acknowledgment ausente
        queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockVersionNoAck),
        };
        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);
        await expect(useCase.execute('game-id', payload)).rejects.toThrow(ConflictException);

        // acknowledgment.acknowledged = false
        queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockVersionNotAck),
        };
        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);
        await expect(useCase.execute('game-id', payload)).rejects.toThrow(ConflictException);
    });
});
