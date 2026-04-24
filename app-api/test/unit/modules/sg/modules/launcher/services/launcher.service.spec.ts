import { Test, TestingModule } from '@nestjs/testing';

import { GameBuildPlatform } from '@hms/shared-types';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { StorageService } from '@hms-module/modules/storage/services/storage.service';

import { FileHost } from '@src/modules/sg/core/enums/file-host.enum';
import {
    LAUNCHER_MESSAGES,
    LauncherService,
} from '@src/modules/sg/modules/launcher/services/launcher.service';

import { BetterLoggerServiceMock } from 'test/mocks/core/services/better-logger.service.mock';
import { createMockStorageService } from 'test/mocks/core/services/storage.service.mock';

describe('LauncherService', () => {
    let service: LauncherService;
    let storageService: ReturnType<typeof createMockStorageService>;

    beforeEach(async () => {
        storageService = createMockStorageService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LauncherService,
                {
                    provide: StorageService,
                    useValue: storageService,
                },
                {
                    provide: BetterLogger,
                    useClass: BetterLoggerServiceMock,
                },
            ],
        }).compile();

        service = module.get<LauncherService>(LauncherService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('listBuildsPaginated', () => {
        it('should parse versions when filename uses underscore delimiter', async () => {
            (storageService.listObjectsPaginated as jest.Mock).mockResolvedValue({
                objects: [
                    {
                        Key: 'public/launcher-builds/alpha/lung-games-launcher_1.0.0-alpha.3.exe',
                    },
                    {
                        Key: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.2.exe',
                    },
                ],
                isTruncated: false,
                nextContinuationToken: null,
            });

            const result = await service.listBuildsPaginated({
                channel: 'alpha',
                platform: GameBuildPlatform.Windows,
                perPage: 10,
            });

            expect(storageService.listObjectsPaginated).toHaveBeenCalledWith(
                'public/launcher-builds/alpha/',
                1000,
                undefined,
            );

            expect(result.items).toEqual([
                {
                    version: '1.0.0-alpha.3',
                    filename: 'lung-games-launcher_1.0.0-alpha.3.exe',
                    src: 'public/launcher-builds/alpha/lung-games-launcher_1.0.0-alpha.3.exe',
                    host: FileHost.S3,
                },
                {
                    version: '1.0.0-alpha.2',
                    filename: 'com.lung-interactive.sg-launcher-1.0.0-alpha.2.exe',
                    src: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.2.exe',
                    host: FileHost.S3,
                },
            ]);

            expect(result.pagination).toEqual({
                page: 1,
                per_page: 10,
                total: 2,
                total_pages: 1,
                is_truncated: false,
                next_continuation_token: null,
            });
        });

        it('should paginate after global semver sorting across storage pages', async () => {
            (storageService.listObjectsPaginated as jest.Mock)
                .mockResolvedValueOnce({
                    objects: [
                        {
                            Key: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.18.exe',
                        },
                        {
                            Key: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.16.exe',
                        },
                        {
                            Key: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.2.exe',
                        },
                    ],
                    isTruncated: true,
                    nextContinuationToken: 's3-token-1',
                })
                .mockResolvedValueOnce({
                    objects: [
                        {
                            Key: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.25.exe',
                        },
                        {
                            Key: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.24.exe',
                        },
                        {
                            Key: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.23.exe',
                        },
                    ],
                    isTruncated: false,
                    nextContinuationToken: null,
                });

            const result = await service.listBuildsPaginated({
                channel: 'alpha',
                platform: GameBuildPlatform.Windows,
                perPage: 2,
                continuationToken: '2',
            });

            expect(storageService.listObjectsPaginated).toHaveBeenCalledWith(
                'public/launcher-builds/alpha/',
                1000,
                undefined,
            );
            expect(storageService.listObjectsPaginated).toHaveBeenNthCalledWith(
                2,
                'public/launcher-builds/alpha/',
                1000,
                's3-token-1',
            );

            expect(result).toEqual({
                channel: 'alpha',
                items: [
                    {
                        version: '1.0.0-alpha.23',
                        filename: 'com.lung-interactive.sg-launcher-1.0.0-alpha.23.exe',
                        src: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.23.exe',
                        host: FileHost.S3,
                    },
                    {
                        version: '1.0.0-alpha.18',
                        filename: 'com.lung-interactive.sg-launcher-1.0.0-alpha.18.exe',
                        src: 'public/launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.18.exe',
                        host: FileHost.S3,
                    },
                ],
                pagination: {
                    page: 2,
                    per_page: 2,
                    total: 6,
                    total_pages: 3,
                    is_truncated: true,
                    next_continuation_token: '3',
                },
            });
        });

        it('should throw error for invalid channel', async () => {
            await expect(
                service.listBuildsPaginated({
                    channel: 'invalid',
                    platform: GameBuildPlatform.Windows,
                    perPage: 10,
                }),
            ).rejects.toThrow(LAUNCHER_MESSAGES.INVALID_CHANNEL);
        });

        it('should throw error for invalid platform', async () => {
            await expect(
                service.listBuildsPaginated({
                    channel: 'alpha',
                    platform: 999 as GameBuildPlatform,
                    perPage: 10,
                }),
            ).rejects.toThrow(LAUNCHER_MESSAGES.INVALID_PLATFORM);
        });

        it('should throw bad request for invalid continuation token format', async () => {
            await expect(
                service.listBuildsPaginated({
                    channel: 'alpha',
                    platform: GameBuildPlatform.Windows,
                    perPage: 10,
                    continuationToken: 'invalid-token',
                }),
            ).rejects.toThrow(LAUNCHER_MESSAGES.INVALID_CONTINUATION_TOKEN);

            expect(storageService.listObjectsPaginated).not.toHaveBeenCalled();
        });
    });
});
