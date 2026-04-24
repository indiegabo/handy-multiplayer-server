import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GenerateInstallationMetadataUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/development/use-cases/builds/generate-installation-metadata.usecase';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { StorageService } from '@hms-module/modules/storage/services/storage.service';
import { FileHost } from '@src/modules/sg/core/enums/file-host.enum';
import { GameBuildPlatform } from '@hms/shared-types';

describe('GenerateInstallationMetadataUseCase', () => {
    let useCase: GenerateInstallationMetadataUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let storageService: jest.Mocked<StorageService>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GenerateInstallationMetadataUseCase,
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
                    provide: StorageService,
                    useValue: {
                        getDownloadPreSignedUrl: jest.fn(),
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

        useCase = module.get<GenerateInstallationMetadataUseCase>(
            GenerateInstallationMetadataUseCase,
        );
        versionRepository = module.get(VersionRepository);
        storageService = module.get(StorageService);
        logger = module.get(BetterLogger);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    it('should throw NotFoundException when version does not exist', async () => {
        const queryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
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
        };

        await expect(
            useCase.execute('game-id', payload),
        ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when build for platform does not exist', async () => {
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.0.0' },
            builds: [
                {
                    id: 'build-id',
                    platform: GameBuildPlatform.Linux,
                    host: FileHost.S3,
                    filename: 'game-build.zip',
                    src: 'game-builds/game-build.zip',
                },
            ],
        };

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
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
        };

        await expect(
            useCase.execute('game-id', payload),
        ).rejects.toThrow(NotFoundException);
    });

    it('should generate installation metadata successfully', async () => {
        const mockVersion = {
            id: 'version-id',
            semver: { raw: '1.0.0' },
            builds: [
                {
                    id: 'build-id',
                    platform: GameBuildPlatform.Windows,
                    host: FileHost.S3,
                    filename: 'game-build.zip',
                    executable_name: 'game.exe',
                    download_size: 1024000,
                    installed_size: 2048000,
                    src: 'game-builds/game-build.zip',
                    checksum: 'abc123',
                    checksum_type: 'SHA256',
                },
            ],
        };

        const mockPresignedUrl = {
            url: 'https://s3.example.com/signed-url',
            expires_in: 3600,
        };

        const queryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockVersion),
        };

        (versionRepository.createQueryBuilder as jest.Mock).mockReturnValue(
            queryBuilder,
        );
        storageService.getDownloadPreSignedUrl.mockResolvedValue(
            mockPresignedUrl as any,
        );

        const payload = {
            semver: '1.0.0',
            platform: GameBuildPlatform.Windows,
        };

        const result = await useCase.execute('game-id', payload);

        expect(result).toEqual({
            filename: 'game-build.zip',
            executable_name: 'game.exe',
            download_size: 1024000,
            installed_size: 2048000,
            download: mockPresignedUrl,
            checksum: 'abc123',
            checksum_type: 'SHA256',
        });

        expect(storageService.getDownloadPreSignedUrl).toHaveBeenCalledWith(
            'game-builds/game-build.zip',
        );
    });
});
