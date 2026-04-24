import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import {
    VersionCrowdActionsDTO,
    DevelopmentStatus,
    GameAvailability,
    GameVersionState,
    SemanticVersion,
    GameActionTrigger,
    ConnectionPlatform,
    VersionMetadata,
} from '@hms/shared-types';

import { GameInfoDTO } from
    '@src/modules/sg/modules/games/dtos/game-info.dto';
import { GameVersionDTO } from
    '@src/modules/sg/modules/games/dtos/game-versions.dto';
import {
    GMTCreationResponseDTO,
    GMTListingResponseDTO,
} from '@src/modules/sg/modules/games/dtos/game-management-token.dto';

import { GamesBackofficeController } from
    '@src/modules/sg/modules/games/modules/backoffice/controllers/games-backoffice.controller';
import { GamesFacade } from
    '@src/modules/sg/modules/games/modules/backoffice/facades/games.facade';
import { VersionsFacade } from
    '@src/modules/sg/modules/games/modules/backoffice/facades/versions.facade';
import { ManagementTokensFacade } from
    '@src/modules/sg/modules/games/modules/backoffice/facades/management-tokens.facade';
import { CrowdActionsFacade } from
    '@src/modules/sg/modules/games/modules/backoffice/facades/crowd-actions.facade';
import { FilterVersionsUseCase } from
    '@src/modules/sg/core/use-cases/versions/filter-versions.usecase';
import { ApiResponseInterceptor } from
    '@hms-module/core/api/api-response.interceptor';
import { BetterLogger } from
    '@hms-module/modules/better-logger/better-logger.service';
import { MockAdminAuthMiddleware } from '../../utils/mock-admin-auth.middleware';
import { AllowAllGuard } from '../../utils/allow-all.guard';

import {
    createMockGamesFacade,
    MockGamesFacade,
} from '../../../mocks/sg/facades/games.facade.mock';
import {
    createMockVersionsFacade,
    MockVersionsFacade,
} from '../../../mocks/sg/facades/versions.facade.mock';
import {
    createMockManagementTokensFacade,
    MockManagementTokensFacade,
} from '../../../mocks/sg/facades/management-tokens.facade.mock';
import {
    createMockCrowdActionsFacade,
    MockCrowdActionsFacade,
} from '../../../mocks/sg/facades/crowd-actions.facade.mock';
import { RemoveGameImageUseCase } from
    '@src/modules/sg/modules/games/modules/backoffice/use-cases/games/remove-game-image.usecase';
import { RequestGamePurgeUseCase } from
    '@src/modules/sg/modules/games/modules/backoffice/use-cases/games/request-game-purge.usecase';

describe('GamesBackofficeController (e2e)', () => {
    let app: INestApplication;

    let gamesFacade: MockGamesFacade;
    let versionsFacade: MockVersionsFacade;
    let managementTokensFacade: MockManagementTokensFacade;
    let crowdActionsFacade: MockCrowdActionsFacade;
    let filterVersionsUseCase: jest.Mocked<FilterVersionsUseCase>;
    let removeGameImageUseCase: jest.Mocked<RemoveGameImageUseCase>;
    let requestGamePurgeUseCase: jest.Mocked<RequestGamePurgeUseCase>;

    // Sample test data
    const gameId = '11111111-1111-4111-8111-111111111111';
    const versionId = '22222222-2222-4222-8222-222222222222';
    const tokenId = '33333333-3333-4333-8333-333333333333';

    const sampleGame: GameInfoDTO = {
        id: gameId,
        name: 'Test Game',
        description: 'A test game for E2E testing',
        type: 1,
        availability: GameAvailability.Available,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
    };

    const sampleVersion: GameVersionDTO = {
        id: versionId,
        semver: { raw: '1.0.0', major: 1, minor: 0, patch: 0 },
        state: GameVersionState.Ready,
        is_current: false,
        is_prerelease: false,
    };

    const sampleVersionMetadata: VersionMetadata = {
        acknowledgment: {
            acknowledged: true,
            acknowledgedAt: '2026-01-10T10:00:00Z',
        },
        development: {
            status: DevelopmentStatus.Completed,
            startedAt: '2026-01-10T11:00:00Z',
            completedAt: '2026-01-10T15:00:00Z',
        },
    };

    const sampleToken: GMTListingResponseDTO = {
        id: tokenId,
        game_id: gameId,
        partial_view_token: 'sk_test_****1234',
        scopes: [],
        data: {},
        created_at: new Date('2026-01-15T00:00:00Z'),
        updated_at: new Date('2026-01-15T00:00:00Z'),
    };

    const sampleCrowdActions: VersionCrowdActionsDTO = {
        version_id: versionId,
        actions: [
            {
                identifier: 'action1',
                name: 'Jump',
                description: 'Makes the character jump',
                args: [],
            },
        ],
        mappings: [
            {
                identifier: 'action1',
                triggers: [
                    {
                        platform: ConnectionPlatform.Twitch,
                        trigger_type: 'chat',
                        conditions: {},
                        is_enabled: true,
                    },
                ],
                commands: [
                    {
                        name: '/jump',
                        aliases: [],
                        description: 'Jump command',
                        global_cooldown: 0,
                        user_cooldown: 0,
                        admin_only: false,
                        is_enabled: true,
                    },
                ],
            },
        ],
    };

    beforeAll(async () => {
        gamesFacade = createMockGamesFacade();
        versionsFacade = createMockVersionsFacade();
        managementTokensFacade = createMockManagementTokensFacade();
        crowdActionsFacade = createMockCrowdActionsFacade();

        filterVersionsUseCase = {
            execute: jest.fn(),
        } as any;

        removeGameImageUseCase = {
            execute: jest.fn(),
        } as any;

        requestGamePurgeUseCase = {
            execute: jest.fn(),
        } as any;

        const moduleFixture: TestingModule = await Test
            .createTestingModule({
                controllers: [GamesBackofficeController],
                providers: [
                    { provide: GamesFacade, useValue: gamesFacade },
                    { provide: VersionsFacade, useValue: versionsFacade },
                    { provide: ManagementTokensFacade, useValue: managementTokensFacade },
                    { provide: CrowdActionsFacade, useValue: crowdActionsFacade },
                    { provide: FilterVersionsUseCase, useValue: filterVersionsUseCase },
                    {
                        provide: require('@src/modules/sg/modules/games/modules/backoffice/use-cases/games/upload-game-image.usecase').UploadGameImageUseCase,
                        useValue: { execute: jest.fn() },
                    },
                    {
                        provide: RemoveGameImageUseCase,
                        useValue: removeGameImageUseCase,
                    },
                    {
                        provide: RequestGamePurgeUseCase,
                        useValue: requestGamePurgeUseCase,
                    },
                    {
                        provide: BetterLogger,
                        useValue: {
                            setContext: jest.fn(),
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
                ],
            })
            .compile();

        app = moduleFixture.createNestApplication();

        app.use(new MockAdminAuthMiddleware().use);
        app.useGlobalGuards(new AllowAllGuard());
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Games CRUD
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Games CRUD', () => {
        it('GET /games → 200 with paginated games list', async () => {
            gamesFacade.listGames.mockResolvedValue({
                items: [sampleGame],
                meta: {
                    page: 1,
                    per_page: 10,
                    total: 1,
                    total_pages: 1,
                },
            });

            const response = await request(app.getHttpServer())
                .get('/backoffice/games?page=1&per_page=10&term=test&type=1&availability=1&platform=1')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.meta).toEqual(expect.objectContaining({
                page: 1,
                per_page: 10,
                total: 1,
                total_pages: 1,
            }));
            expect(gamesFacade.listGames).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 1,
                    per_page: 10,
                    term: 'test',
                    type: 1,
                    availability: 1,
                    platform: 1,
                }),
            );
        });

        it('POST /games → 201 with created game', async () => {
            gamesFacade.createGame.mockResolvedValue(sampleGame);

            const payload = {
                name: 'Test Game',
                type: 1, // GameType.Regular
            };

            const response = await request(app.getHttpServer())
                .post('/backoffice/games')
                .send(payload)
                .expect(201);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: gameId,
                name: 'Test Game',
            }));
            expect(gamesFacade.createGame).toHaveBeenCalledWith(
                expect.objectContaining(payload),
            );
        });

        it('PUT /games/:id → 200 with updated game', async () => {
            const updatedGame = { ...sampleGame, name: 'Updated Game' };
            gamesFacade.updateGame.mockResolvedValue(updatedGame);

            const payload = { name: 'Updated Game' };

            const response = await request(app.getHttpServer())
                .put(`/backoffice/games/${gameId}`)
                .send(payload)
                .expect(200);

            expect(response.body.data.name).toBe('Updated Game');
            expect(gamesFacade.updateGame).toHaveBeenCalledWith(
                gameId,
                expect.objectContaining(payload),
            );
        });

        it('GET /games/:id → 200 with game info', async () => {
            gamesFacade.getGameById.mockResolvedValue(sampleGame);

            const response = await request(app.getHttpServer())
                .get(`/backoffice/games/${gameId}`)
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: gameId,
                name: 'Test Game',
            }));
            expect(gamesFacade.getGameById).toHaveBeenCalledWith(gameId);
        });

        it('PUT /games/:id with invalid UUID → 400', async () => {
            await request(app.getHttpServer())
                .put('/backoffice/games/invalid-uuid')
                .send({ name: 'Test' })
                .expect(400);
        });

        it('DELETE /games/:id/images?ratio=16:9 → 200 and removes game image', async () => {
            removeGameImageUseCase.execute.mockResolvedValue({
                deleted: true,
                media_id: '44444444-4444-4444-8444-444444444444',
                file_key: '/public/games/111/images/a.png',
                ratio: '16:9',
            });

            const response = await request(app.getHttpServer())
                .delete(`/backoffice/games/${gameId}/images?ratio=16:9`)
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                deleted: true,
                ratio: '16:9',
            }));
            expect(removeGameImageUseCase.execute).toHaveBeenCalledWith({
                gameId,
                ratio: '16:9',
            });
        });

        it('DELETE /games/:id/images without ratio → 400', async () => {
            await request(app.getHttpServer())
                .delete(`/backoffice/games/${gameId}/images`)
                .expect(400);

            expect(removeGameImageUseCase.execute).not.toHaveBeenCalled();
        });
    });

    describe('Update platforms (backoffice)', () => {
        it('GET /backoffice/games/:id/versions/:versionId/platforms → 200 and forwards to facade', async () => {
            const platforms = ['twitch', 'youtube'];
            gamesFacade.getGameById.mockResolvedValue(sampleGame);
            versionsFacade.getVersionRuntimePlatforms.mockResolvedValue(platforms as any);

            const response = await request(app.getHttpServer())
                .get(`/backoffice/games/${gameId}/versions/${versionId}/platforms`)
                .expect(200);

            expect(response.body.data).toEqual(platforms);
            expect(gamesFacade.getGameById).toHaveBeenCalledWith(gameId);
            expect(versionsFacade.getVersionRuntimePlatforms).toHaveBeenCalledWith(versionId);
        });

        it('PUT /backoffice/games/:id/versions/:versionId/platforms → 200 and forwards to facade', async () => {
            const platforms = ['twitch', 'youtube'];
            versionsFacade.setVersionRuntimePlatforms.mockResolvedValue({ version_id: versionId, platforms });

            const response = await request(app.getHttpServer())
                .put(`/backoffice/games/${gameId}/versions/${versionId}/platforms`)
                .send({ platforms })
                .expect(200);

            expect(response.body.data).toEqual({ version_id: versionId, platforms });
            expect(versionsFacade.setVersionRuntimePlatforms).toHaveBeenCalledWith(gameId, versionId, platforms);
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Versions Management
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Versions Management', () => {
        it('GET /games/:id/versions → 200 with versions array', async () => {
            versionsFacade.getGameVersions.mockResolvedValue([sampleVersion]);

            const response = await request(app.getHttpServer())
                .get(`/backoffice/games/${gameId}/versions`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0]).toEqual(expect.objectContaining({
                id: versionId,
                semver: expect.objectContaining({
                    raw: expect.any(String),
                }),
            }));
            expect(versionsFacade.getGameVersions).toHaveBeenCalledWith(gameId);
        });

        it('GET /games/:id/versions/:versionId/metadata → 200 with metadata', async () => {
            versionsFacade.getVersionMetadata.mockResolvedValue(sampleVersionMetadata);

            const response = await request(app.getHttpServer())
                .get(`/backoffice/games/${gameId}/versions/${versionId}/metadata`)
                .expect(200);

            expect(response.body.data).toEqual(
                expect.objectContaining({
                    acknowledgment: expect.any(Object),
                    development: expect.any(Object),
                }),
            );
            expect(versionsFacade.getVersionMetadata).toHaveBeenCalledWith(versionId);
        });

        it('PUT /games/:id/versions/:versionId/set-as-ready → 200', async () => {
            const readyVersion = { ...sampleVersion, state: GameVersionState.Ready };
            versionsFacade.setVersionAsReady.mockResolvedValue(readyVersion);

            const response = await request(app.getHttpServer())
                .put(`/backoffice/games/${gameId}/versions/${versionId}/set-as-ready`)
                .expect(200);

            expect(response.body.data.state).toBe(GameVersionState.Ready);
            expect(versionsFacade.setVersionAsReady).toHaveBeenCalledWith(
                gameId,
                versionId,
            );
        });

        it('PUT /games/:id/versions/:versionId/set-as-rejected → 200', async () => {
            const rejectedVersion = { ...sampleVersion, state: GameVersionState.Rejected };
            versionsFacade.setVersionAsRejected.mockResolvedValue(rejectedVersion);

            const response = await request(app.getHttpServer())
                .put(`/backoffice/games/${gameId}/versions/${versionId}/set-as-rejected`)
                .expect(200);

            expect(response.body.data.state).toBe(GameVersionState.Rejected);
            expect(versionsFacade.setVersionAsRejected).toHaveBeenCalledWith(
                gameId,
                versionId,
            );
        });

        it('PUT /games/:id/versions/:versionId/set-as-under-development → 200', async () => {
            const devVersion = { ...sampleVersion, state: GameVersionState.UnderDevelopment };
            versionsFacade.setVersionAsUnderDevelopment.mockResolvedValue(devVersion);

            const response = await request(app.getHttpServer())
                .put(`/backoffice/games/${gameId}/versions/${versionId}/set-as-under-development`)
                .expect(200);

            expect(response.body.data.state).toBe(GameVersionState.UnderDevelopment);
            expect(versionsFacade.setVersionAsUnderDevelopment).toHaveBeenCalledWith(
                gameId,
                versionId,
            );
        });

        it('PUT /games/:id/versions/:versionId/set-as-canceled → 200', async () => {
            const canceledVersion = { ...sampleVersion, state: GameVersionState.Canceled };
            versionsFacade.setVersionAsCanceled.mockResolvedValue(canceledVersion);

            const response = await request(app.getHttpServer())
                .put(`/backoffice/games/${gameId}/versions/${versionId}/set-as-canceled`)
                .expect(200);

            expect(response.body.data.state).toBe(GameVersionState.Canceled);
            expect(versionsFacade.setVersionAsCanceled).toHaveBeenCalledWith(
                gameId,
                versionId,
            );
        });

        it('POST /games/:id/versions → 201 with created version', async () => {
            versionsFacade.createGameVersion.mockResolvedValue(sampleVersion);

            const payload = {
                semver: '1.0.0',
            };

            const response = await request(app.getHttpServer())
                .post(`/backoffice/games/${gameId}/versions`)
                .send(payload)
                .expect(201);

            expect(response.body.data).toEqual(expect.objectContaining({
                semver: expect.objectContaining({
                    raw: expect.any(String),
                    major: expect.any(Number),
                    minor: expect.any(Number),
                    patch: expect.any(Number),
                }),
            }));
            expect(versionsFacade.createGameVersion).toHaveBeenCalledWith(
                gameId,
                payload.semver,
            );
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Crowd Actions
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Crowd Actions', () => {
        it('GET /games/:id/versions/:versionId/crowd-actions → 200 with crowd actions', async () => {
            crowdActionsFacade.getVersionCrowdActions.mockResolvedValue(
                sampleCrowdActions,
            );

            await request(app.getHttpServer())
                .get(`/games/${gameId}/versions/${versionId}/crowd-actions`)
                .expect(404);
        });

        it('PUT /games/:id/versions/:versionId/crowd-actions → 200 with updated actions', async () => {
            crowdActionsFacade.updateVersionCrowdActions.mockResolvedValue(
                sampleCrowdActions,
            );

            const payload = {
                actions: [
                    {
                        identifier: 'action1',
                        name: 'Jump',
                        description: 'Jump action',
                        args: [],
                    },
                ],
            };

            const response = await request(app.getHttpServer())
                .put(`/backoffice/games/${gameId}/versions/${versionId}/crowd-actions`)
                .send(payload)
                .expect(200);

            expect(crowdActionsFacade.updateVersionCrowdActions).toHaveBeenCalledWith(
                gameId,
                versionId,
                expect.any(Array),
            );
        });

        it('PUT /games/:id/versions/:versionId/crowd-actions/mappings → 200', async () => {
            crowdActionsFacade.updateVersionCrowdMappings.mockResolvedValue(
                sampleCrowdActions,
            );

            const payload = {
                mappings: [
                    {
                        identifier: 'action1',
                        triggers: [
                            {
                                platform: ConnectionPlatform.Twitch,
                                trigger_type: 'chat',
                                conditions: {},
                                is_enabled: true,
                            },
                        ],
                        commands: [
                            {
                                name: '/jump',
                                aliases: [],
                                description: 'Jump',
                                global_cooldown: 0,
                                user_cooldown: 0,
                                admin_only: false,
                                is_enabled: true,
                            },
                        ],
                    },
                ],
            };

            const response = await request(app.getHttpServer())
                .put(`/backoffice/games/${gameId}/versions/${versionId}/crowd-actions/mappings`)
                .send(payload)
                .expect(200);

            expect(crowdActionsFacade.updateVersionCrowdMappings).toHaveBeenCalledWith(
                gameId,
                versionId,
                expect.any(Array),
            );
        });

        it('PUT /games/:id/versions/:versionId/crowd → 200 (atomic update)', async () => {
            crowdActionsFacade.updateVersionCrowd.mockResolvedValue(sampleCrowdActions);

            const payload = {
                actions: [
                    { identifier: 'action1', name: 'A', description: 'd', args: [] },
                ],
                mappings: [
                    { identifier: 'action1', triggers: [], commands: [] },
                ],
            };

            const response = await request(app.getHttpServer())
                .put(`/backoffice/games/${gameId}/versions/${versionId}/crowd`)
                .send(payload)
                .expect(200);

            expect(crowdActionsFacade.updateVersionCrowd).toHaveBeenCalledWith(
                gameId,
                versionId,
                expect.any(Array),
                expect.any(Array),
            );
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Management Tokens
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Management Tokens', () => {
        it('GET /games/:id/management-tokens → 200 with tokens array', async () => {
            managementTokensFacade.getManagementTokens.mockResolvedValue([
                sampleToken,
            ]);

            const response = await request(app.getHttpServer())
                .get(`/backoffice/games/${gameId}/management-tokens`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0]).toEqual(expect.objectContaining({
                id: tokenId,
                partial_view_token: expect.any(String),
            }));
            expect(managementTokensFacade.getManagementTokens).toHaveBeenCalledWith(
                gameId,
            );
        });

        it('POST /games/:id/management-tokens → 201 with created token', async () => {
            const createdToken: GMTCreationResponseDTO = {
                id: tokenId,
                game_id: gameId,
                token: 'sk_test_full_token_1234567890',
                scopes: [],
                data: {},
                created_at: new Date('2026-01-15T00:00:00Z'),
                updated_at: new Date('2026-01-15T00:00:00Z'),
            };
            managementTokensFacade.createManagementToken.mockResolvedValue(
                createdToken,
            );

            const response = await request(app.getHttpServer())
                .post(`/backoffice/games/${gameId}/management-tokens`)
                .send({})
                .expect(201);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: tokenId,
                token: expect.any(String),
            }));
            expect(managementTokensFacade.createManagementToken).toHaveBeenCalledWith(
                gameId,
                expect.any(Object),
                expect.any(Object),
            );
        });

        it('DELETE /games/:id/management-tokens/revoke-all → 200', async () => {
            managementTokensFacade.revokeAllManagementTokens.mockResolvedValue(
                undefined,
            );

            const response = await request(app.getHttpServer())
                .delete(`/backoffice/games/${gameId}/management-tokens/revoke-all`)
                .expect(200);

            expect(
                managementTokensFacade.revokeAllManagementTokens,
            ).toHaveBeenCalledWith(gameId);
        });

        it('DELETE /games/:id/management-tokens/destroy-all → 200', async () => {
            managementTokensFacade.destroyAllManagementTokens.mockResolvedValue(
                undefined,
            );

            const response = await request(app.getHttpServer())
                .delete(`/backoffice/games/${gameId}/management-tokens/destroy-all`)
                .expect(200);

            expect(
                managementTokensFacade.destroyAllManagementTokens,
            ).toHaveBeenCalledWith(gameId);
        });

        it('DELETE /games/:id/management-tokens/:token_id/revoke → 200', async () => {
            managementTokensFacade.revokeManagementToken.mockResolvedValue(
                undefined,
            );

            const response = await request(app.getHttpServer())
                .delete(`/backoffice/games/${gameId}/management-tokens/${tokenId}/revoke`)
                .expect(200);

            expect(
                managementTokensFacade.revokeManagementToken,
            ).toHaveBeenCalledWith(gameId, tokenId);
        });

        it('DELETE /games/:id/management-tokens/:token_id/destroy → 200', async () => {
            managementTokensFacade.destroyManagementToken.mockResolvedValue(
                undefined,
            );

            const response = await request(app.getHttpServer())
                .delete(`/backoffice/games/${gameId}/management-tokens/${tokenId}/destroy`)
                .expect(200);

            expect(
                managementTokensFacade.destroyManagementToken,
            ).toHaveBeenCalledWith(gameId, tokenId);
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Versions Filtering
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Versions Filtering', () => {
        const version1 = {
            id: '11111111-1111-4111-8111-111111111111',
            entity_type: 'Game',
            entity_id: '99999999-9999-4999-8999-999999999999',
            semver: { raw: '1.0.0', major: 1, minor: 0, patch: 0 },
            state: GameVersionState.Ready,
            is_current: true,
            is_prerelease: false,
            notes: null,
            meta: null,
            released_at: new Date('2026-01-01T00:00:00Z'),
            created_at: new Date('2026-01-01T00:00:00Z'),
            updated_at: new Date('2026-01-01T00:00:00Z'),
            builds: [],
        };

        const version2 = {
            id: '22222222-2222-4222-8222-222222222222',
            entity_type: 'Game',
            entity_id: '99999999-9999-4999-8999-999999999999',
            semver: { raw: '1.1.0-beta.1', major: 1, minor: 1, patch: 0 },
            state: GameVersionState.UnderDevelopment,
            is_current: false,
            is_prerelease: true,
            notes: null,
            meta: null,
            released_at: new Date('2026-01-05T00:00:00Z'),
            created_at: new Date('2026-01-05T00:00:00Z'),
            updated_at: new Date('2026-01-05T00:00:00Z'),
            builds: [],
        };

        const version3 = {
            id: '33333333-3333-4333-8333-333333333333',
            entity_type: 'Game',
            entity_id: '99999999-9999-4999-8999-999999999999',
            semver: { raw: '0.9.0', major: 0, minor: 9, patch: 0 },
            state: GameVersionState.Deprecated,
            is_current: false,
            is_prerelease: false,
            notes: null,
            meta: null,
            released_at: new Date('2025-12-01T00:00:00Z'),
            created_at: new Date('2025-12-01T00:00:00Z'),
            updated_at: new Date('2025-12-01T00:00:00Z'),
            builds: [],
        };

        it('GET /games/versions/filter → 200 with empty filter returns all versions', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1, version2, version3]);

            const response = await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter')
                .expect(200);

            expect(response.body.data).toHaveLength(3);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith({
                created_after: undefined,
                created_before: undefined,
            });
        });

        it('GET /games/versions/filter?state=1 → 200 returns versions by state', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            const response = await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter?state=1')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe(version1.id);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith({
                state: 1,
                created_after: undefined,
                created_before: undefined,
            });
        });

        it('GET /games/versions/filter?is_current=true → 200 returns current version', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            const response = await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter?is_current=true')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].is_current).toBe(true);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith({
                is_current: true,
                created_after: undefined,
                created_before: undefined,
            });
        });

        it('GET /games/versions/filter?is_prerelease=true → 200', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version2]);

            const response = await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter?is_prerelease=true')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].is_prerelease).toBe(true);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith({
                is_prerelease: true,
                created_after: undefined,
                created_before: undefined,
            });
        });

        it('GET /games/versions/filter?semver_raw=1.0.0 → 200', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            const response = await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter?semver_raw=1.0.0')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].semver.raw).toBe('1.0.0');
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith({
                semver_raw: '1.0.0',
                created_after: undefined,
                created_before: undefined,
            });
        });

        it('GET /games/versions/filter?entity_type=Launcher → 200', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            const response = await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter?entity_type=Launcher')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith({
                entity_type: 'Launcher',
                created_after: undefined,
                created_before: undefined,
            });
        });

        it('GET /games/versions/filter with date range → 200', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version2]);

            const after = '2026-01-01T00:00:00Z';
            const before = '2026-01-15T23:59:59Z';

            const response = await request(app.getHttpServer())
                .get(
                    `/backoffice/games/versions/filter?created_after=${after}&created_before=${before}`,
                )
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith({
                created_after: new Date(after),
                created_before: new Date(before),
            });
        });

        it('GET /games/versions/filter with multiple filters → 200', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            const response = await request(app.getHttpServer())
                .get(
                    '/backoffice/games/versions/filter?state=1&is_current=true&is_prerelease=false',
                )
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith({
                state: 1,
                is_current: true,
                is_prerelease: false,
                created_after: undefined,
                created_before: undefined,
            });
        });

        it('GET /games/versions/filter → 200 with empty results', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([]);

            const response = await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter?semver_raw=999.999.999')
                .expect(200);

            expect(response.body.data).toHaveLength(0);
        });

        it('GET /games/versions/filter with invalid state → 400', async () => {
            await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter?state=invalid')
                .expect(400);
        });

        it('GET /games/versions/filter with invalid date format → 400', async () => {
            await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter?created_after=not-a-date')
                .expect(400);
        });

        it('GET /games/versions/filter with invalid boolean → 400', async () => {
            await request(app.getHttpServer())
                .get('/backoffice/games/versions/filter?is_current=maybe')
                .expect(400);
        });
    });
});
