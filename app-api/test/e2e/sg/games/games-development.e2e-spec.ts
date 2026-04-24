import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import {
    GameVersionState,
    DevelopmentStatus,
    SemanticVersion,
    VersionMetadata,
} from '@hms/shared-types';

import { GamesDevelopmentController } from
    '@src/modules/sg/modules/games/modules/development/controllers/games-development.controller';
import { DevelopmentVersionsFacade } from
    '@src/modules/sg/modules/games/modules/development/facades/development-versions.facade';
import { DevelopmentBuildsFacade } from
    '@src/modules/sg/modules/games/modules/development/facades/development-builds.facade';
import { FilterVersionsUseCase } from
    '@src/modules/sg/core/use-cases/versions/filter-versions.usecase';
import { AllowedToManageGameGuard } from
    '@src/modules/sg/core/guards/allowed-to-manage-game.guard';
import { VersionDTO } from
    '@src/modules/sg/modules/games/dtos/version.dto';
import { StartBuildUploadResponseDTO } from
    '@src/modules/sg/modules/games/dtos/start-build-upload.dto';
import { ApiResponseInterceptor } from
    '@hms-module/core/api/api-response.interceptor';
import { BetterLogger } from
    '@hms-module/modules/better-logger/better-logger.service';
import { MockGameAuthMiddleware } from '../../utils/mock-game-auth.middleware';
import { AllowAllGuard } from '../../utils/allow-all.guard';

import {
    createMockDevelopmentVersionsFacade,
    MockDevelopmentVersionsFacade,
} from '../../../mocks/sg/facades/development-versions.facade.mock';
import {
    createMockDevelopmentBuildsFacade,
    MockDevelopmentBuildsFacade,
} from '../../../mocks/sg/facades/development-builds.facade.mock';

describe('GamesDevelopmentController (e2e)', () => {
    let app: INestApplication;

    let versionsFacade: MockDevelopmentVersionsFacade;
    let buildsFacade: MockDevelopmentBuildsFacade;
    let filterVersionsUseCase: jest.Mocked<FilterVersionsUseCase>;

    // Sample test data
    const gameId = '11111111-1111-4111-8111-111111111111';
    const versionId = '22222222-2222-4222-8222-222222222222';
    const uploadToken = 'upload-token-123';

    const sampleVersion: VersionDTO = {
        id: versionId,
        semver: { raw: '1.0.0', major: 1, minor: 0, patch: 0 } as SemanticVersion,
        state: GameVersionState.AwaitingDevelopmentApproval,
        is_current: false,
        is_prerelease: false,
        release_notes: null,
    };

    const sampleMetadata: VersionMetadata = {
        acknowledgment: {
            acknowledged: true,
            acknowledgedAt: '2026-01-15T10:00:00Z',
        },
        development: {
            status: DevelopmentStatus.InProgress,
            startedAt: '2026-01-15T11:00:00Z',
        },
    };

    const sampleUploadResponse: StartBuildUploadResponseDTO = {
        upload_token: uploadToken,
        signed_url: {
            url: 'https://s3.amazonaws.com/bucket/key?signature=xyz',
            expires_at: new Date('2026-01-15T12:00:00Z'),
        },
    };

    beforeAll(async () => {
        versionsFacade = createMockDevelopmentVersionsFacade();
        buildsFacade = createMockDevelopmentBuildsFacade();

        filterVersionsUseCase = {
            execute: jest.fn(),
        } as any;

        const moduleFixture: TestingModule = await Test
            .createTestingModule({
                controllers: [GamesDevelopmentController],
                providers: [
                    { provide: DevelopmentVersionsFacade, useValue: versionsFacade },
                    { provide: DevelopmentBuildsFacade, useValue: buildsFacade },
                    { provide: FilterVersionsUseCase, useValue: filterVersionsUseCase },
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
            .overrideGuard(AllowedToManageGameGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();

        app.use(new MockGameAuthMiddleware(gameId).use);
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
     * Token Validation
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Token Validation', () => {
        it('GET /game-development/validate-token → 200 with true', async () => {
            const response = await request(app.getHttpServer())
                .get('/game-development/validate-token')
                .expect(200);

            expect(response.body.data).toBe(true);
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Version Operations
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Version Operations', () => {
        it('GET /game-development/versions → 200 with current version', async () => {
            const currentVersion = { ...sampleVersion, is_current: true };
            versionsFacade.getCurrentVersion.mockResolvedValue(currentVersion);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions')
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: versionId,
                is_current: true,
            }));
            expect(versionsFacade.getCurrentVersion).toHaveBeenCalledWith(gameId);
        });

        it('GET /game-development/versions/latest → 200 with latest version', async () => {
            versionsFacade.getLatestVersion.mockResolvedValue(sampleVersion);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions/latest')
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: versionId,
            }));
            expect(versionsFacade.getLatestVersion).toHaveBeenCalledWith(gameId);
        });

        it('POST /game-development/versions/start-new → 201 with new version', async () => {
            versionsFacade.startNewVersion.mockResolvedValue(sampleVersion);

            const payload = {
                version_update_type: 1, // SPECIFIC_VERSION
                specific_version: '1.0.0',
            };

            const response = await request(app.getHttpServer())
                .post('/game-development/versions/start-new')
                .send(payload)
                .expect(201);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: versionId,
            }));
            expect(versionsFacade.startNewVersion).toHaveBeenCalledWith(
                gameId,
                expect.objectContaining(payload),
            );
        });

        it('GET /game-development/versions/in-preparation → 200 with version', async () => {
            versionsFacade.getVersionInPreparation.mockResolvedValue(sampleVersion);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions/in-preparation')
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: versionId,
                state: GameVersionState.AwaitingDevelopmentApproval,
            }));
            expect(versionsFacade.getVersionInPreparation).toHaveBeenCalledWith(gameId);
        });

        it('GET /game-development/versions/under-development → 200 with version', async () => {
            const underDevVersion = { ...sampleVersion, state: GameVersionState.UnderDevelopment };
            versionsFacade.getVersionUnderDevelopment.mockResolvedValue(underDevVersion);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions/under-development')
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                id: versionId,
                state: GameVersionState.UnderDevelopment,
            }));
            expect(versionsFacade.getVersionUnderDevelopment).toHaveBeenCalledWith(gameId);
        });

        it('GET /game-development/versions/:versionId/metadata → 200 with metadata', async () => {
            versionsFacade.getVersionMetadata.mockResolvedValue(sampleMetadata);

            const response = await request(app.getHttpServer())
                .get(`/game-development/versions/${versionId}/metadata`)
                .expect(200);

            expect(response.body.data).toEqual(expect.objectContaining({
                acknowledgment: expect.any(Object),
                development: expect.any(Object),
            }));
            expect(versionsFacade.getVersionMetadata).toHaveBeenCalledWith(versionId);
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Version Lifecycle
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Version Lifecycle', () => {
        it('POST /game-development/versions/:versionId/acknowledge → 201 with metadata', async () => {
            versionsFacade.acknowledgeVersion.mockResolvedValue(sampleMetadata);

            const payload = {
                notes: 'Starting development',
            };

            const response = await request(app.getHttpServer())
                .post(`/game-development/versions/${versionId}/acknowledge`)
                .send(payload)
                .expect(201);

            expect(response.body.data).toEqual(expect.objectContaining({
                acknowledgment: expect.objectContaining({
                    acknowledged: true,
                }),
            }));
            expect(versionsFacade.acknowledgeVersion).toHaveBeenCalledWith(
                versionId,
                payload.notes,
            );
        });

        it('DELETE /game-development/versions/cancel-in-preparation → 200', async () => {
            versionsFacade.cancelVersionInPreparation.mockResolvedValue(undefined);

            await request(app.getHttpServer())
                .delete('/game-development/versions/cancel-in-preparation')
                .expect(200);

            expect(versionsFacade.cancelVersionInPreparation).toHaveBeenCalledWith(gameId);
        });

        it('POST /game-development/versions/send-to-homologation → 201', async () => {
            versionsFacade.sendToHomologation.mockResolvedValue(undefined);

            const payload = {
                semver: '1.0.0',
            };

            await request(app.getHttpServer())
                .post('/game-development/versions/send-to-homologation')
                .send(payload)
                .expect(201);

            expect(versionsFacade.sendToHomologation).toHaveBeenCalledWith(
                gameId,
                expect.objectContaining(payload),
            );
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
     * Build Operations
     * ─────────────────────────────────────────────────────────────────────
     */

    describe('Build Operations', () => {
        it('POST /game-development/start-build-upload → 201 with upload data', async () => {
            buildsFacade.startBuildUpload.mockResolvedValue(sampleUploadResponse);

            const payload = {
                semver: '1.0.0',
                platform: 1, // GameBuildPlatform.Windows
                executable_name: 'game.exe',
                filename: 'game-windows-1.0.0.zip',
                download_size: 1024000,
                installed_size: 2048000,
                host: 1, // FileHost.S3
                override_existing: false,
            };

            const response = await request(app.getHttpServer())
                .post('/game-development/start-build-upload')
                .send(payload)
                .expect(201);
            expect(response.body.data).toEqual(expect.objectContaining({
                upload_token: uploadToken,
                signed_url: expect.objectContaining({
                    url: expect.any(String),
                }),
            }));
            expect(buildsFacade.startBuildUpload).toHaveBeenCalledWith(
                gameId,
                expect.objectContaining(payload),
            );
        });

        it('POST /game-development/confirm-build-upload → 201', async () => {
            buildsFacade.confirmBuildUpload.mockResolvedValue(undefined);

            const payload = {
                semver: '1.0.0',
                upload_token: uploadToken,
                platform: 1, // GameBuildPlatform.Windows
            };

            await request(app.getHttpServer())
                .post('/game-development/confirm-build-upload')
                .send(payload)
                .expect(201);

            expect(buildsFacade.confirmBuildUpload).toHaveBeenCalledWith(
                gameId,
                expect.objectContaining(payload),
            );
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
            entity_id: gameId,
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
            entity_id: gameId,
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
            entity_id: gameId,
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

        it('GET /game-development/versions/filter → 200 returns all versions for game', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1, version2, version3]);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions/filter')
                .expect(200);

            expect(response.body.data).toHaveLength(3);
            // Verify game_id is always included from token
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    game_id: gameId,
                }),
            );
        });

        it('GET /game-development/versions/filter?state=1 → 200 filters by state', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions/filter?state=1')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe(version1.id);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    state: 1,
                    game_id: gameId,
                }),
            );
        });

        it('GET /game-development/versions/filter?is_current=true → 200 filters current version', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions/filter?is_current=true')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].is_current).toBe(true);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    is_current: true,
                    game_id: gameId,
                }),
            );
        });

        it('GET /game-development/versions/filter?is_prerelease=true → 200', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version2]);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions/filter?is_prerelease=true')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].is_prerelease).toBe(true);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    is_prerelease: true,
                    game_id: gameId,
                }),
            );
        });

        it('GET /game-development/versions/filter?semver_raw=1.0.0 → 200', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions/filter?semver_raw=1.0.0')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].semver.raw).toBe('1.0.0');
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    semver_raw: '1.0.0',
                    game_id: gameId,
                }),
            );
        });

        it('GET /game-development/versions/filter with date range → 200', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version2]);

            const after = '2026-01-01T00:00:00Z';
            const before = '2026-01-15T23:59:59Z';

            const response = await request(app.getHttpServer())
                .get(
                    `/game-development/versions/filter?created_after=${after}&created_before=${before}`,
                )
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    game_id: gameId,
                    created_after: new Date(after),
                    created_before: new Date(before),
                }),
            );
        });

        it('GET /game-development/versions/filter with multiple filters → 200', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            const response = await request(app.getHttpServer())
                .get(
                    '/game-development/versions/filter?state=1&is_current=true&is_prerelease=false',
                )
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    state: 1,
                    is_current: true,
                    is_prerelease: false,
                    game_id: gameId,
                }),
            );
        });

        it('GET /game-development/versions/filter → 200 with empty results', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([]);

            const response = await request(app.getHttpServer())
                .get('/game-development/versions/filter?semver_raw=999.999.999')
                .expect(200);

            expect(response.body.data).toHaveLength(0);
        });

        it('GET /game-development/versions/filter with invalid state → 400', async () => {
            await request(app.getHttpServer())
                .get('/game-development/versions/filter?state=invalid')
                .expect(400);
        });

        it('GET /game-development/versions/filter with invalid date format → 400', async () => {
            await request(app.getHttpServer())
                .get('/game-development/versions/filter?created_after=not-a-date')
                .expect(400);
        });

        it('GET /game-development/versions/filter with invalid boolean → 400', async () => {
            await request(app.getHttpServer())
                .get('/game-development/versions/filter?is_current=maybe')
                .expect(400);
        });

        it('GET /game-development/versions/filter always includes game_id from token', async () => {
            filterVersionsUseCase.execute.mockResolvedValue([version1]);

            // Make request without explicitly passing game_id
            await request(app.getHttpServer())
                .get('/game-development/versions/filter?state=1')
                .expect(200);

            // Verify game_id is automatically included from token
            expect(filterVersionsUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    game_id: gameId, // Extracted from token by @GameFromToken decorator
                }),
            );
        });
    });
});
