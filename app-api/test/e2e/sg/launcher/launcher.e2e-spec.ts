import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import {
    GameBuildPlatform,
    LauncherVersionState,
} from '@hms/shared-types';
import { ApiResponseInterceptor } from '@hms-module/core/api/api-response.interceptor';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';

import { FileHost } from '@src/modules/sg/core/enums/file-host.enum';
import { LauncherPublicController } from '@src/modules/sg/modules/launcher/modules/public/controllers/launcher-public.controller';
import { LauncherBackofficeController } from '@src/modules/sg/modules/launcher/modules/backoffice/controllers/launcher-backoffice.controller';
import { LauncherDevelopmentController } from '@src/modules/sg/modules/launcher/modules/development/controllers/launcher-development.controller';
import { LauncherPublicFacade } from '@src/modules/sg/modules/launcher/modules/public/facades/launcher-public.facade';
import { LauncherBackofficeFacade } from '@src/modules/sg/modules/launcher/modules/backoffice/facades/launcher-backoffice.facade';
import { LauncherDevelopmentFacade } from '@src/modules/sg/modules/launcher/modules/development/facades/launcher-development.facade';
import { LauncherService } from '@src/modules/sg/modules/launcher/services/launcher.service';
import {
    LauncherReleaseChannel,
} from '@src/modules/sg/modules/launcher/dto/create-launcher-candidate-version.dto';
import { ListLauncherBuildsUseCase } from '@src/modules/sg/modules/launcher/use-cases/list-launcher-builds.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { LauncherCiCdTokenGuard } from '@src/modules/sg/modules/launcher/modules/development/guards/launcher-cicd-token.guard';
import { GetLauncherVersionEndUserChangelogBySemverUseCase } from '@src/modules/sg/modules/launcher/use-cases/get-launcher-version-end-user-changelog-by-semver.usecase';
import { MockAdminAuthMiddleware } from '../../utils/mock-admin-auth.middleware';
import { AllowAllGuard } from '../../utils/allow-all.guard';

describe('Launcher Controllers (e2e)', () => {
    let app: INestApplication;
    let launcherService: {
        listBuildsPaginated: jest.Mock;
    };
    let versionRepository: {
        findOneByEntitySemverRawAndStates: jest.Mock;
    };
    let launcherBackofficeFacade: {
        getLauncherVersionBasicInfo: jest.Mock;
        getLauncherVersionDevelopment: jest.Mock;
        publishCandidateVersion: jest.Mock;
        releaseCandidateInstallersOnly: jest.Mock;
        listLauncherVersions: jest.Mock;
        listCandidateVersions: jest.Mock;
    };
    let launcherDevelopmentFacade: {
        createCandidateVersion: jest.Mock;
    };
    const cicdToken = 'test-launcher-cicd-token';

    beforeAll(async () => {
        process.env.LAUNCHER_CICD_API_TOKEN = cicdToken;

        launcherService = {
            listBuildsPaginated: jest.fn(),
        };

        versionRepository = {
            findOneByEntitySemverRawAndStates: jest.fn(),
        };

        launcherBackofficeFacade = {
            getLauncherVersionBasicInfo: jest.fn(),
            getLauncherVersionDevelopment: jest.fn(),
            publishCandidateVersion: jest.fn(),
            releaseCandidateInstallersOnly: jest.fn(),
            listLauncherVersions: jest.fn(),
            listCandidateVersions: jest.fn(),
        };

        launcherDevelopmentFacade = {
            createCandidateVersion: jest.fn(),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [
                LauncherPublicController,
                LauncherBackofficeController,
                LauncherDevelopmentController,
            ],
            providers: [
                LauncherPublicFacade,
                ListLauncherBuildsUseCase,
                GetLauncherVersionEndUserChangelogBySemverUseCase,
                {
                    provide: LauncherBackofficeFacade,
                    useValue: launcherBackofficeFacade,
                },
                {
                    provide: VersionRepository,
                    useValue: versionRepository,
                },
                {
                    provide: LauncherDevelopmentFacade,
                    useValue: launcherDevelopmentFacade,
                },
                {
                    provide: LauncherService,
                    useValue: launcherService,
                },
                LauncherCiCdTokenGuard,
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
            ],
        }).compile();

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
        delete process.env.LAUNCHER_CICD_API_TOKEN;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('GET /launcher/page should return paginated builds with default filters',
        async () => {
            launcherService.listBuildsPaginated.mockResolvedValue({
                channel: 'latest',
                items: [
                    {
                        version: '1.0.0',
                        filename: 'launcher-1.0.0.exe',
                        src: 'launcher-builds/latest/launcher-1.0.0.exe',
                        host: FileHost.S3,
                    },
                ],
                pagination: {
                    page: 1,
                    per_page: 20,
                    total: 1,
                    total_pages: 1,
                    is_truncated: false,
                    next_continuation_token: null,
                },
            });

            const response = await request(app.getHttpServer())
                .get('/launcher/page')
                .expect(200);

            expect(response.body.data.channel).toBe('latest');
            expect(response.body.data.items).toHaveLength(1);
            expect(launcherService.listBuildsPaginated).toHaveBeenCalledWith({
                channel: 'latest',
                platform: GameBuildPlatform.Windows,
                page: undefined,
                perPage: 20,
                continuationToken: undefined,
            });
        });

    it('GET /launcher/page should accept channel and continuation token',
        async () => {
            launcherService.listBuildsPaginated.mockResolvedValue({
                channel: 'alpha',
                items: [],
                pagination: {
                    page: 2,
                    per_page: 10,
                    total: 40,
                    total_pages: 4,
                    is_truncated: true,
                    next_continuation_token: '3',
                },
            });

            const response = await request(app.getHttpServer())
                .get('/launcher/page')
                .query({
                    channel: 'alpha',
                    platform: String(GameBuildPlatform.Linux),
                    limit: '10',
                    continuation_token: '2',
                })
                .expect(200);

            expect(response.body.data.channel).toBe('alpha');
            expect(response.body.data.pagination.next_continuation_token)
                .toBe('3');
            expect(launcherService.listBuildsPaginated).toHaveBeenCalledWith({
                channel: 'alpha',
                platform: GameBuildPlatform.Linux,
                page: undefined,
                perPage: 10,
                continuationToken: '2',
            });
        });

    it('GET /launcher/page should return 400 for invalid limit', async () => {
        await request(app.getHttpServer())
            .get('/launcher/page')
            .query({ limit: '0' })
            .expect(400);

        expect(launcherService.listBuildsPaginated).not.toHaveBeenCalled();
    });

    it('POST /launcher/changelog/end-user should return changelog by semver',
        async () => {
            versionRepository.findOneByEntitySemverRawAndStates
                .mockResolvedValue({
                    id: 'version-1',
                    semver: {
                        raw: '1.0.0-alpha.19',
                        major: 1,
                        minor: 0,
                        patch: 0,
                        prerelease: 'alpha.19',
                    },
                    state: LauncherVersionState.Released,
                    notes: {
                        end_user_changelog:
                            '## What is new\n- Better rollback safety',
                    },
                });

            const response = await request(app.getHttpServer())
                .post('/launcher/changelog/end-user')
                .send({
                    semver_raw: '1.0.0-alpha.19',
                })
                .expect(200);

            expect(versionRepository.findOneByEntitySemverRawAndStates)
                .toHaveBeenCalledWith(
                    'Launcher',
                    '1.0.0-alpha.19',
                    [
                        LauncherVersionState.Released,
                        LauncherVersionState.Deprecated,
                    ],
                );

            expect(response.body.data).toEqual(
                expect.objectContaining({
                    semver_raw: '1.0.0-alpha.19',
                    end_user_changelog:
                        '## What is new\n- Better rollback safety',
                }),
            );
        });

    it('POST /launcher/changelog/end-user should return 400 for invalid semver payload',
        async () => {
            await request(app.getHttpServer())
                .post('/launcher/changelog/end-user')
                .send({
                    semver_raw: 'invalid-semver',
                })
                .expect(400);

            expect(versionRepository.findOneByEntitySemverRawAndStates)
                .not.toHaveBeenCalled();
        });

    it('POST /launcher-development/versions/candidates should create candidate version',
        async () => {
            launcherDevelopmentFacade.createCandidateVersion.mockResolvedValue({
                id: 'version-1',
                launcher_id: 'launcher-1',
                semver: {
                    raw: '2.4.0-beta.2',
                    major: 2,
                    minor: 4,
                    patch: 0,
                    prerelease: 'beta.2',
                },
                state: LauncherVersionState.ReleaseCandidate,
                is_prerelease: true,
                channel: LauncherReleaseChannel.Beta,
                created_at: '2026-04-14T20:12:00.000Z',
                development: {
                    candidate: {
                        status: 'candidate',
                    },
                },
            });

            const payload = {
                semver: '2.4.0-beta.2',
                channel: LauncherReleaseChannel.Beta,
                branch: 'beta',
                semantic_changelog: ['feat(updater): improve rollback safety'],
                artifacts: [
                    {
                        platform: GameBuildPlatform.Windows,
                        filename: 'launcher-2.4.0-beta.2.exe',
                        s3_key: 'candidates/launcher/beta/2.4.0-beta.2/win/launcher.exe',
                        checksum: 'checksum-win-1',
                        checksum_type: 'sha512',
                        download_size: 123,
                        installed_size: 456,
                    },
                    {
                        platform: GameBuildPlatform.Linux,
                        filename: 'launcher-2.4.0-beta.2.AppImage',
                        s3_key: 'candidates/launcher/beta/2.4.0-beta.2/linux/launcher.AppImage',
                        checksum: 'checksum-linux-1',
                        checksum_type: 'sha512',
                        download_size: 789,
                        installed_size: 999,
                    },
                ],
            };

            const response = await request(app.getHttpServer())
                .post('/launcher-development/versions/candidates')
                .set('Authorization', `Bearer ${cicdToken}`)
                .send(payload)
                .expect(201);

            expect(launcherDevelopmentFacade.createCandidateVersion)
                .toHaveBeenCalledWith(payload);
            expect(response.body.data.id).toBe('version-1');
            expect(response.body.data.channel).toBe(LauncherReleaseChannel.Beta);
        });

    it('GET /backoffice/launcher/versions/candidates should list candidate versions',
        async () => {
            launcherBackofficeFacade.listCandidateVersions.mockResolvedValue([
                {
                    id: 'version-1',
                    launcher_id: 'launcher-1',
                    semver: {
                        raw: '2.4.0-beta.2',
                        major: 2,
                        minor: 4,
                        patch: 0,
                        prerelease: 'beta.2',
                    },
                    state: LauncherVersionState.ReleaseCandidate,
                    is_prerelease: true,
                    channel: LauncherReleaseChannel.Beta,
                    created_at: '2026-04-14T20:12:00.000Z',
                    development: {
                        candidate: {
                            status: 'candidate',
                        },
                    },
                },
            ]);

            const response = await request(app.getHttpServer())
                .get('/backoffice/launcher/versions/candidates')
                .expect(200);

            expect(launcherBackofficeFacade.listCandidateVersions)
                .toHaveBeenCalledTimes(1);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe('version-1');
        });

    it('GET /backoffice/launcher/versions should list versions with meta and filters',
        async () => {
            launcherBackofficeFacade.listLauncherVersions.mockResolvedValue({
                items: [
                    {
                        id: 'version-2',
                        launcher_id: 'launcher-1',
                        semver: {
                            raw: '2.5.0',
                            major: 2,
                            minor: 5,
                            patch: 0,
                        },
                        state: LauncherVersionState.Released,
                        is_current: true,
                        is_prerelease: false,
                        channel: LauncherReleaseChannel.Latest,
                        created_at: '2026-04-14T21:00:00.000Z',
                        updated_at: '2026-04-14T21:10:00.000Z',
                        released_at: '2026-04-14T21:20:00.000Z',
                        development: null,
                    },
                ],
                meta: {
                    page: 2,
                    per_page: 10,
                    total: 1,
                    total_pages: 1,
                },
            });

            const response = await request(app.getHttpServer())
                .get('/backoffice/launcher/versions')
                .query({
                    page: '2',
                    per_page: '10',
                    state: String(LauncherVersionState.Released),
                    is_current: 'true',
                    channel: LauncherReleaseChannel.Latest,
                })
                .expect(200);

            expect(launcherBackofficeFacade.listLauncherVersions)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        page: 2,
                        per_page: 10,
                        state: LauncherVersionState.Released,
                        is_current: true,
                        channel: LauncherReleaseChannel.Latest,
                    }),
                );
            expect(response.body.data).toHaveLength(1);
            expect(response.body.meta).toEqual(expect.objectContaining({
                page: 2,
                per_page: 10,
                total: 1,
                total_pages: 1,
            }));
        });

    it('GET /backoffice/launcher/versions/:id should return basic version info',
        async () => {
            const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';

            launcherBackofficeFacade.getLauncherVersionBasicInfo.mockResolvedValue({
                id: versionId,
                launcher_id: 'd68e1da8-2bc6-4c61-a273-a567849b58b0',
                semver: {
                    raw: '2.5.0',
                    major: 2,
                    minor: 5,
                    patch: 0,
                },
                state: LauncherVersionState.Released,
                is_current: true,
                is_prerelease: false,
                channel: LauncherReleaseChannel.Latest,
                created_at: '2026-04-14T21:00:00.000Z',
                updated_at: '2026-04-14T21:10:00.000Z',
                released_at: '2026-04-14T21:20:00.000Z',
            });

            const response = await request(app.getHttpServer())
                .get(`/backoffice/launcher/versions/${versionId}`)
                .expect(200);

            expect(launcherBackofficeFacade.getLauncherVersionBasicInfo)
                .toHaveBeenCalledWith(versionId);
            expect(response.body.data).toEqual(expect.objectContaining({
                id: versionId,
                channel: LauncherReleaseChannel.Latest,
                state: LauncherVersionState.Released,
            }));
        });

    it('GET /backoffice/launcher/versions/:id/development should return development metadata',
        async () => {
            const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';

            launcherBackofficeFacade.getLauncherVersionDevelopment.mockResolvedValue({
                candidate: {
                    channel: LauncherReleaseChannel.Beta,
                    branch: 'beta',
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/backoffice/launcher/versions/${versionId}/development`)
                .expect(200);

            expect(launcherBackofficeFacade.getLauncherVersionDevelopment)
                .toHaveBeenCalledWith(versionId);
            expect(response.body.data).toEqual(expect.objectContaining({
                candidate: expect.objectContaining({
                    channel: LauncherReleaseChannel.Beta,
                }),
            }));
        });

    it('POST /backoffice/launcher/versions/:id/publish should publish candidate',
        async () => {
            const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';

            launcherBackofficeFacade.publishCandidateVersion.mockResolvedValue({
                version_id: versionId,
                semver: '1.0.0-alpha.19',
                channel: LauncherReleaseChannel.Alpha,
                moved_artifacts: 4,
                updated_yml_files: [
                    'public/launcher-builds/alpha/alpha.yml',
                    'public/launcher-builds/alpha/alpha-linux.yml',
                ],
                released_at: '2026-04-15T20:55:00.000Z',
            });

            const response = await request(app.getHttpServer())
                .post(`/backoffice/launcher/versions/${versionId}/publish`)
                .expect(201);

            expect(launcherBackofficeFacade.publishCandidateVersion)
                .toHaveBeenCalledWith(versionId);
            expect(response.body.data.moved_artifacts).toBe(4);
            expect(response.body.data.channel).toBe(LauncherReleaseChannel.Alpha);
        });

    it('POST /backoffice/launcher/versions/:id/release/installers-only should release without updater',
        async () => {
            const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';

            launcherBackofficeFacade.releaseCandidateInstallersOnly.mockResolvedValue({
                version_id: versionId,
                semver: '1.0.0-alpha.19',
                channel: LauncherReleaseChannel.Alpha,
                moved_artifacts: 2,
                updated_yml_files: [],
                released_at: '2026-04-15T21:10:00.000Z',
            });

            const response = await request(app.getHttpServer())
                .post(
                    `/backoffice/launcher/versions/${versionId}/release/installers-only`,
                )
                .expect(201);

            expect(launcherBackofficeFacade.releaseCandidateInstallersOnly)
                .toHaveBeenCalledWith(versionId);
            expect(response.body.data.moved_artifacts).toBe(2);
            expect(response.body.data.updated_yml_files).toEqual([]);
        });

    it('POST /launcher-development/versions/candidates should return 401 without token',
        async () => {
            await request(app.getHttpServer())
                .post('/launcher-development/versions/candidates')
                .send({
                    semver: '2.4.0-beta.2',
                    channel: LauncherReleaseChannel.Beta,
                    semantic_changelog: ['feat: update'],
                    artifacts: [
                        {
                            platform: GameBuildPlatform.Windows,
                            filename: 'launcher-2.4.0-beta.2.exe',
                            s3_key: 'candidates/launcher/beta/2.4.0-beta.2/win/launcher.exe',
                        },
                    ],
                })
                .expect(401);

            expect(launcherDevelopmentFacade.createCandidateVersion)
                .not.toHaveBeenCalled();
        });

    it('POST /launcher-development/versions/candidates should return 400 for invalid payload',
        async () => {
            await request(app.getHttpServer())
                .post('/launcher-development/versions/candidates')
                .set('Authorization', `Bearer ${cicdToken}`)
                .send({
                    semver: 'invalid',
                    channel: LauncherReleaseChannel.Beta,
                    semantic_changelog: [],
                    artifacts: [],
                })
                .expect(400);

            expect(launcherDevelopmentFacade.createCandidateVersion)
                .not.toHaveBeenCalled();
        });
});
