import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import {
    SemanticVersion,
    VersionCrowdActionsDTO,
    GameVersionState,
} from '@hms/shared-types';

import { GameInfoDTO } from
    '@src/modules/sg/modules/games/dtos/game-info.dto';
import { GameVersionDTO } from
    '@src/modules/sg/modules/games/dtos/game-versions.dto';
import { GameInstallationMetadataDTO } from
    '@src/modules/sg/modules/games/dtos/game-installation-metadata.dto';

import { GamesController } from
    '@src/modules/sg/modules/games/modules/public/controllers/games.controller';
import { RuntimeController } from
    '@src/modules/sg/modules/games/modules/runtime/controllers/runtime.controller';
import { GamesService } from
    '@src/modules/sg/modules/games/modules/public/services/games.service';
import { MediaService } from '@hms-module/modules/media/services/media.service';
import { StorageService } from '@hms-module/modules/storage/services/storage.service';
import { ApiResponseInterceptor } from
    '@hms-module/core/api/api-response.interceptor';
import { BetterLogger } from
    '@hms-module/modules/better-logger/better-logger.service';
import { AllowAllGuard } from '../../utils/allow-all.guard';

import { GamesPublicFacade } from '@src/modules/sg/modules/games/modules/public/facades/games-public.facade';
import { RuntimeFacade } from '@src/modules/sg/modules/games/modules/runtime/facades/runtime.facade';

import {
    createMockGamesService,
    MockGamesService,
} from '../../../mocks/sg/services/games.service.mock';

describe('GamesController (Public - e2e)', () => {
    let app: INestApplication;
    let gamesService: MockGamesService;
    let gamesPublicFacade: {
        getVersionCrowdActions: jest.Mock;
        getVersionPlatforms: jest.Mock;
        getVersionRuntime: jest.Mock;
    };
    let mockGamesPublicFacade: any;
    let listGamesUseCase: { execute: jest.Mock };
    let moduleFixture: TestingModule;

    // Sample test data
    const gameId = '11111111-1111-4111-8111-111111111111';
    const versionId = '22222222-2222-4222-8222-222222222222';

    const sampleGameInfo: GameInfoDTO = {
        id: gameId,
        name: 'Test Game',
        description: 'A test game for public E2E testing',
        type: 1, // GameType.Backseat
        availability: 1,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
    } as any;

    const sampleVersion: GameVersionDTO = {
        id: versionId,
        semver: { raw: '1.0.0', major: 1, minor: 0, patch: 0 } as SemanticVersion,
        state: GameVersionState.Released,
        is_current: true,
        is_prerelease: false,
        notes: null,
    };

    const sampleInstallationMetadata: GameInstallationMetadataDTO = {
        filename: 'game-windows-1.0.0.zip',
        download_size: 1024000,
        installed_size: 2048000,
        executable_name: 'game.exe',
        download: {
            url: 'https://s3.amazonaws.com/bucket/key?signature=xyz',
            expires_at: new Date('2026-01-15T12:00:00Z'),
        },
    };

    const sampleCrowdActions: VersionCrowdActionsDTO = {
        version_id: versionId,
        actions: [
            {
                identifier: 'action-1',
                name: 'Jump',
                description: 'Jump action',
                args: [],
            },
        ],
        mappings: [
            {
                identifier: 'action-1',
                triggers: [],
                commands: [],
            },
        ],
    };

    beforeAll(async () => {
        gamesService = createMockGamesService();

        mockGamesPublicFacade = {
            getVersionCrowdActions: jest.fn(),
            getVersionPlatforms: jest.fn(),
            getVersionRuntime: jest.fn(),
            getInstallationMetadata: jest.fn(),
            getLatestVersion: jest.fn(),
            getWaitingForApprovalVersions: jest.fn(),
            getHomologationAccess: jest.fn(),
        };

        const mockListGamesUseCase = { execute: jest.fn() };
        listGamesUseCase = mockListGamesUseCase;
        moduleFixture = await Test
            .createTestingModule({
                controllers: [GamesController, RuntimeController],
                providers: [
                    { provide: GamesService, useValue: gamesService },
                    { provide: MediaService, useValue: { findOneMediaByMetadataConditions: jest.fn() } },
                    { provide: StorageService, useValue: { getResolvedUrl: jest.fn() } },
                    {
                        provide: BetterLogger,
                        useValue: {
                            setContext: jest.fn(),
                            setMessagesColor: jest.fn(),
                            log: jest.fn(),
                            error: jest.fn(),
                            warn: jest.fn(),
                            debug: jest.fn(),
                        },
                    },
                    {
                        provide: APP_INTERCEPTOR,
                        useClass: ApiResponseInterceptor,
                    },
                    {
                        provide: GamesPublicFacade,
                        useValue: mockGamesPublicFacade,
                    },
                    {
                        provide: RuntimeFacade,
                        useValue: mockGamesPublicFacade,
                    },
                    {
                        provide: require('@src/modules/sg/modules/games/core/use-cases/list-games.usecase').ListGamesUseCase,
                        useValue: mockListGamesUseCase,
                    },
                ],
            })
            .compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );

        gamesPublicFacade = moduleFixture.get(GamesPublicFacade);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Get game image', () => {
        it('POST /games/:id/image → 200 returns image DTO', async () => {
            const mediaService = moduleFixture.get(MediaService) as any;
            const storage = moduleFixture.get(StorageService) as any;

            const media = {
                id: 'm1',
                filename: 'cover.png',
                mimetype: 'image/png',
                size: 1234,
                metadata: { file_key: '/public/games/11111111-1111-4111-8111-111111111111/images/m1.png', ratio: '16:9' },
                created_at: new Date(),
                updated_at: new Date(),
            };

            (gamesService.getGameById as jest.Mock).mockResolvedValue(sampleGameInfo);
            (mediaService.findOneMediaByMetadataConditions as jest.Mock).mockResolvedValue(media);
            (storage.getResolvedUrl as jest.Mock).mockResolvedValue('https://cdn.example.com/m1.png');

            const res = await request(app.getHttpServer())
                .post(`/games/${gameId}/image`)
                .send({ ratio: '16:9' })
                .expect(200);

            expect(res.body.data).toEqual(
                expect.objectContaining({
                    status: 'found',
                    url: 'https://cdn.example.com/m1.png',
                    filename: 'cover.png',
                }),
            );
        });

        it('POST /games/:id/image → 200 with status not found when image is missing', async () => {
            const mediaService = moduleFixture.get(MediaService) as any;

            (gamesService.getGameById as jest.Mock).mockResolvedValue(sampleGameInfo);
            (mediaService.findOneMediaByMetadataConditions as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .post(`/games/${gameId}/image`)
                .send({ ratio: '16:9' })
                .expect(200);

            expect(response.body.data).toEqual(
                expect.objectContaining({
                    status: 'not found',
                }),
            );
            expect(response.body.data.url).toBeUndefined();
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Get All Games
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Games Listing', () => {
        it('GET /games → 200 with games array', async () => {
            listGamesUseCase.execute.mockResolvedValue({
                items: [sampleGameInfo],
                meta: {
                    page: 1,
                    per_page: 20,
                    total: 1,
                    total_pages: 1,
                },
            });

            const response = await request(app.getHttpServer())
                .get('/games')
                .expect(200);

            expect(response.body.data).toEqual([
                expect.objectContaining({
                    id: gameId,
                    name: 'Test Game',
                }),
            ]);
            expect(listGamesUseCase.execute).toHaveBeenCalledWith(
                expect.any(Object),
                { publicView: true },
            );
        });

        it('GET /games with filters → 200 passing filters to service', async () => {
            listGamesUseCase.execute.mockResolvedValue({
                items: [sampleGameInfo],
                meta: {
                    page: 1,
                    per_page: 20,
                    total: 1,
                    total_pages: 1,
                },
            });

            const response = await request(app.getHttpServer())
                .get('/games')
                .query({ term: 'test' });

            if (response.status !== 200) {
                console.log('Error response:', JSON.stringify(response.body, null, 2));
            }

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([
                expect.objectContaining({
                    id: gameId,
                }),
            ]);
            expect(listGamesUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    term: 'test',
                }),
                { publicView: true },
            );
        });

        it('GET /games → 200 with empty array when no games found', async () => {
            listGamesUseCase.execute.mockResolvedValue({ items: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } });

            const response = await request(app.getHttpServer())
                .get('/games')
                .expect(200);

            expect(response.body.data).toEqual([]);
            expect(listGamesUseCase.execute).toHaveBeenCalledWith(expect.any(Object), { publicView: true });
        });
    });

    describe('Version platforms', () => {
        it('GET /games/:id/versions/:versionId/platforms → 200 with platforms array', async () => {
            const platforms = ['twitch', 'youtube'];
            gamesService.getGameById.mockResolvedValue(sampleGameInfo);
            gamesPublicFacade.getVersionPlatforms.mockResolvedValue(platforms);

            const response = await request(app.getHttpServer())
                .get(`/games/${gameId}/versions/${versionId}/platforms`)
                .expect(200);

            expect(response.body.data).toEqual(platforms);
            expect(gamesPublicFacade.getVersionPlatforms).toHaveBeenCalledWith(gameId, versionId);
        });
    });

    describe('Version runtime', () => {
        it('GET /games/:id/versions/:versionId/runtime → 200 with runtime object', async () => {
            const runtime = { platforms: ['twitch'], settings: { max_users: 10 } };
            gamesService.getGameById.mockResolvedValue(sampleGameInfo);
            gamesPublicFacade.getVersionRuntime.mockResolvedValue(runtime);

            const response = await request(app.getHttpServer())
                .get(`/games/${gameId}/versions/${versionId}/runtime`)
                .expect(200);

            expect(response.body.data).toEqual(runtime);
            expect(gamesPublicFacade.getVersionRuntime).toHaveBeenCalledWith(gameId, versionId);
        });

        it('GET /games/:id/versions/:versionId/runtime when availability not allowed → 403', async () => {
            gamesService.getGameById.mockResolvedValue({ ...sampleGameInfo, availability: 5 });

            await request(app.getHttpServer())
                .get(`/games/${gameId}/versions/${versionId}/runtime`)
                .expect(403);

            expect(gamesPublicFacade.getVersionRuntime).not.toHaveBeenCalled();
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Get Game By ID
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Get Game By ID', () => {
        it('GET /games/:id → 200 with game details', async () => {
            gamesService.getGameById.mockResolvedValue(sampleGameInfo);

            const response = await request(app.getHttpServer())
                .get(`/games/${gameId}`)
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: gameId,
                name: 'Test Game',
            }));
            expect(gamesService.getGameById).toHaveBeenCalledWith(gameId);
        });

        it('GET /games/:id with invalid UUID → 400', async () => {
            await request(app.getHttpServer())
                .get('/games/invalid-uuid')
                .expect(400);

            expect(gamesService.getGameById).not.toHaveBeenCalled();
        });

        it('GET /games/:id when not found → 404', async () => {
            gamesService.getGameById.mockRejectedValue(
                new Error('Game not found'),
            );

            await request(app.getHttpServer())
                .get(`/games/${gameId}`)
                .expect(500);

            expect(gamesService.getGameById).toHaveBeenCalledWith(gameId);
        });

        it('GET /games/:id when availability not allowed → 403', async () => {
            gamesService.getGameById.mockResolvedValue({
                ...sampleGameInfo,
                availability: 5, // Unlisted
            });

            const response = await request(app.getHttpServer())
                .get(`/games/${gameId}`)
                .expect(403);

            expect(gamesService.getGameById).toHaveBeenCalledWith(gameId);
            expect(response.body.message).toBeDefined();
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Get Installation Metadata
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Game Installation Metadata', () => {
        it('GET /games/:id/installation-metadata → 200 with download data', async () => {
            gamesService.getGameById.mockResolvedValue(sampleGameInfo);
            mockGamesPublicFacade.getInstallationMetadata
                .mockResolvedValue(sampleInstallationMetadata);

            const response = await request(app.getHttpServer())
                .get(`/games/${gameId}/installation-metadata`)
                .query({
                    semver: '1.0.0',
                    platform: 1, // Windows
                })
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                filename: 'game-windows-1.0.0.zip',
                download_size: 1024000,
                installed_size: 2048000,
                executable_name: 'game.exe',
                download: expect.objectContaining({
                    url: expect.any(String),
                }),
            }));

            expect(mockGamesPublicFacade.getInstallationMetadata).toHaveBeenCalledWith(
                gameId,
                expect.objectContaining({
                    semver: '1.0.0',
                    platform: 1,
                }),
            );
        });

        it('GET /games/:id/installation-metadata with invalid UUID → 400', async () => {
            await request(app.getHttpServer())
                .get('/games/invalid-uuid/installation-metadata')
                .query({ semver: '1.0.0', platform: 1 })
                .expect(400);

            expect(mockGamesPublicFacade.getInstallationMetadata).not.toHaveBeenCalled();
        });

        it('GET /games/:id/installation-metadata when game not found → error',
            async () => {
                mockGamesPublicFacade.getInstallationMetadata.mockRejectedValue(
                    new Error('Game not found'),
                );

                await request(app.getHttpServer())
                    .get(`/games/${gameId}/installation-metadata`)
                    .query({ semver: '1.0.0', platform: 1 })
                    .expect(500);

                expect(
                    mockGamesPublicFacade.getInstallationMetadata,
                ).toHaveBeenCalled();
            });

        it('GET /games/:id/installation-metadata when availability not allowed → 403', async () => {
            gamesService.getGameById.mockResolvedValue({
                ...sampleGameInfo,
                availability: 5,
            });

            await request(app.getHttpServer())
                .get(`/games/${gameId}/installation-metadata`)
                .query({ semver: '1.0.0', platform: 1 })
                .expect(403);

            expect(mockGamesPublicFacade.getInstallationMetadata).not.toHaveBeenCalled();
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Get Current Version
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Get Current Version', () => {
        it('GET /games/:id/current-version → 200 with version details', async () => {
            gamesService.getGameById.mockResolvedValue(sampleGameInfo);
            mockGamesPublicFacade.getLatestVersion.mockResolvedValue(sampleVersion);

            const response = await request(app.getHttpServer())
                .get(`/games/${gameId}/current-version`)
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: versionId,
                semver: expect.objectContaining({
                    raw: '1.0.0',
                }),
                state: GameVersionState.Released,
                is_current: true,
            }));

            expect(mockGamesPublicFacade.getLatestVersion).toHaveBeenCalledWith(gameId);
        });

        it('GET /games/:id/current-version with invalid UUID → 400', async () => {
            await request(app.getHttpServer())
                .get('/games/invalid-uuid/current-version')
                .expect(400);

            expect(mockGamesPublicFacade.getLatestVersion).not.toHaveBeenCalled();
        });

        it('GET /games/:id/current-version when version not found → error',
            async () => {
                mockGamesPublicFacade.getLatestVersion.mockRejectedValue(
                    new Error('Current version not found'),
                );

                await request(app.getHttpServer())
                    .get(`/games/${gameId}/current-version`)
                    .expect(500);

                expect(mockGamesPublicFacade.getLatestVersion).toHaveBeenCalledWith(gameId);
            });

        it('GET /games/:id/current-version when availability not allowed → 403', async () => {
            gamesService.getGameById.mockResolvedValue({
                ...sampleGameInfo,
                availability: 5,
            });

            await request(app.getHttpServer())
                .get(`/games/${gameId}/current-version`)
                .expect(403);

            expect(mockGamesPublicFacade.getLatestVersion).not.toHaveBeenCalled();
        });
    });

    describe('Homologation Access', () => {
        it('GET /games/:id/homologation-access → 200 with access flags', async () => {
            mockGamesPublicFacade.getHomologationAccess.mockResolvedValue({
                game_id: gameId,
                can_view_waiting_versions: true,
                can_install_waiting_versions: true,
                waiting_versions_count: 3,
                policy_source: 'per-game:active-tester',
                checked_at: '2026-04-11T17:00:00.000Z',
            });

            const response = await request(app.getHttpServer())
                .get(`/games/${gameId}/homologation-access`)
                .expect(200);

            expect(response.body.data).toEqual({
                game_id: gameId,
                can_view_waiting_versions: true,
                can_install_waiting_versions: true,
                waiting_versions_count: 3,
                policy_source: 'per-game:active-tester',
                checked_at: '2026-04-11T17:00:00.000Z',
            });
            expect(mockGamesPublicFacade.getHomologationAccess)
                .toHaveBeenCalledWith(gameId, undefined);
        });

        it('GET /games/:id/homologation-access with invalid UUID → 400', async () => {
            await request(app.getHttpServer())
                .get('/games/invalid-uuid/homologation-access')
                .expect(400);

            expect(mockGamesPublicFacade.getHomologationAccess)
                .not.toHaveBeenCalled();
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Crowd Actions
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Crowd Actions', () => {
        it('GET /games/:id/versions/:versionId/crowd-actions with UUID → 200', async () => {
            gamesService.getGameById.mockResolvedValue(sampleGameInfo);
            gamesPublicFacade.getVersionCrowdActions.mockResolvedValue(
                sampleCrowdActions,
            );

            const response = await request(app.getHttpServer())
                .get(`/games/${gameId}/versions/${versionId}/crowd-actions`)
                .expect(200);

            expect(response.body.data).toEqual({
                actions: sampleCrowdActions.actions,
                mappings: sampleCrowdActions.mappings,
            });
            expect(gamesPublicFacade.getVersionCrowdActions).toHaveBeenCalledWith(
                gameId,
                versionId,
            );
        });

        it('GET /games/:id/versions/:versionId/crowd-actions with SemVer → 200', async () => {
            const semver = '1.0.2-beta.1';

            gamesService.getGameById.mockResolvedValue(sampleGameInfo);
            gamesPublicFacade.getVersionCrowdActions.mockResolvedValue(
                sampleCrowdActions,
            );

            const response = await request(app.getHttpServer())
                .get(`/games/${gameId}/versions/${semver}/crowd-actions`)
                .expect(200);

            expect(response.body.data).toEqual({
                actions: sampleCrowdActions.actions,
                mappings: sampleCrowdActions.mappings,
            });
            expect(gamesPublicFacade.getVersionCrowdActions).toHaveBeenCalledWith(
                gameId,
                semver,
            );
        });

        it('GET /games/:id/versions/:versionId/crowd-actions with invalid identifier → 400', async () => {
            await request(app.getHttpServer())
                .get(`/games/${gameId}/versions/not-a-valid-version/crowd-actions`)
                .expect(400);

            expect(gamesPublicFacade.getVersionCrowdActions).not.toHaveBeenCalled();
        });

        it('GET /games/:id/versions/:versionId/crowd-actions when availability not allowed → 403', async () => {
            gamesService.getGameById.mockResolvedValue({
                ...sampleGameInfo,
                availability: 5,
            });

            await request(app.getHttpServer())
                .get(`/games/${gameId}/versions/${versionId}/crowd-actions`)
                .expect(403);

            expect(gamesPublicFacade.getVersionCrowdActions).not.toHaveBeenCalled();
        });
    });
});
