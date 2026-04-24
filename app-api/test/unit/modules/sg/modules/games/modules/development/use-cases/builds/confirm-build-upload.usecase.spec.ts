import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { ConfirmBuildUploadUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/builds/confirm-build-upload.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { StorageService } from '@hms-module/modules/storage/services/storage.service';
import { RedisService } from '@hms-module/modules/redis/redis.service';
import { DataSource, QueryRunner } from 'typeorm';
import { GameBuildState } from '@src/modules/sg/core/enums/game-build-state.enum';
import { GameBuildPlatform } from '@hms/shared-types';

describe('ConfirmBuildUploadUseCase', () => {
    let useCase: ConfirmBuildUploadUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let gameRepository: jest.Mocked<GameRepository>;
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
                ConfirmBuildUploadUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        createQueryBuilder: jest.fn(() => ({
                            leftJoinAndSelect: jest.fn().mockReturnThis(),
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
                    provide: StorageService,
                    useValue: {
                        checkFileExists: jest.fn(),
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        get: jest.fn(),
                        del: jest.fn(),
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
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<ConfirmBuildUploadUseCase>(
            ConfirmBuildUploadUseCase,
        );
        versionRepository = module.get(VersionRepository);
        gameRepository = module.get(GameRepository);
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
            upload_token: 'test-token',
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw NotFoundException when upload token not found', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        redisService.get.mockResolvedValue(null);

        const payload = {
            upload_token: 'test-token',
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('should throw BadRequestException when token metadata does not match', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const redisData = JSON.stringify({
            gameId: 'game-id',
            semver: '1.0.0',
            platform: GameBuildPlatform.Linux,
            filename: 'game-build.zip',
        });

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        redisService.get.mockResolvedValue(redisData);

        const payload = {
            upload_token: 'test-token',
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            BadRequestException,
        );
    });

    it('should throw ConflictException when build is not in Pending state', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const redisData = JSON.stringify({
            gameId: 'game-id',
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
            filename: 'game-build.zip',
        });
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.0.0' },
            builds: [
                {
                    id: 'build-id',
                    platform: GameBuildPlatform.Windows,
                    filename: 'game-build.zip',
                    state: GameBuildState.Active,
                    src: 'game-builds/game-build.zip',
                },
            ],
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        redisService.get.mockResolvedValue(redisData);

        const queryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockVersion),
        };

        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(
            queryBuilder,
        );

        const payload = {
            upload_token: 'test-token',
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            ConflictException,
        );
    });

    it('should throw NotFoundException when build file does not exist in storage', async () => {
        const mockGame = { id: 'game-id', name: 'Test Game' };
        const redisData = JSON.stringify({
            gameId: 'game-id',
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
            filename: 'game-build.zip',
        });
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.0.0' },
            builds: [
                {
                    id: 'build-id',
                    platform: GameBuildPlatform.Windows,
                    filename: 'game-build.zip',
                    state: GameBuildState.Pending,
                    src: 'game-builds/game-build.zip',
                },
            ],
        };

        gameRepository.findOne.mockResolvedValue(mockGame as any);
        redisService.get.mockResolvedValue(redisData);
        storageService.checkFileExists.mockResolvedValue(false);

        const queryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockVersion),
        };

        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(
            queryBuilder,
        );

        const payload = {
            upload_token: 'test-token',
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
        };

        await expect(useCase.execute('game-id', payload)).rejects.toThrow(
            NotFoundException,
        );
    });
});
