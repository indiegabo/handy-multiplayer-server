import { Test, TestingModule } from '@nestjs/testing';

import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import {
    AccessPolicy,
    AUTH_SUBJECT_KEY,
} from '@hms-module/core/decorators/auth-subject.decorator';
import {
    LauncherVersionState,
    PaginatedResult,
} from '@hms/shared-types';
import {
    LauncherCandidateVersionResponseDto,
    LauncherReleaseChannel,
} from '@src/modules/sg/modules/launcher/dto/create-launcher-candidate-version.dto';
import {
    LauncherVersionBasicInfoDto,
} from '@src/modules/sg/modules/launcher/dto/get-launcher-version-by-id.dto';
import {
    GetBackofficeLauncherVersionsFilterDto,
    LauncherVersionListItemDto,
} from '@src/modules/sg/modules/launcher/dto/list-launcher-versions.dto';
import {
    PublishLauncherCandidateVersionResponseDto,
} from '@src/modules/sg/modules/launcher/dto/publish-launcher-candidate-version.dto';
import { LauncherBackofficeController } from '@src/modules/sg/modules/launcher/modules/backoffice/controllers/launcher-backoffice.controller';
import { LauncherBackofficeFacade } from '@src/modules/sg/modules/launcher/modules/backoffice/facades/launcher-backoffice.facade';

import { BetterLoggerServiceMock } from 'test/mocks/core/services/better-logger.service.mock';

describe('LauncherBackofficeController', () => {
    let controller: LauncherBackofficeController;
    let launcherBackofficeFacade: jest.Mocked<LauncherBackofficeFacade>;
    const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';

    const mockedCandidate: LauncherCandidateVersionResponseDto = {
        id: 'version-1',
        launcher_id: 'launcher-1',
        semver: {
            raw: '2.4.0-beta.2',
            major: 2,
            minor: 4,
            patch: 0,
            prerelease: 'beta.2',
        },
        state: 4,
        is_prerelease: true,
        channel: LauncherReleaseChannel.Beta,
        created_at: '2026-04-14T19:45:00.000Z',
        development: {
            candidate: {
                status: 'candidate',
            },
        },
    };

    const mockedVersion: LauncherVersionListItemDto = {
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
        created_at: '2026-04-14T20:45:00.000Z',
        updated_at: '2026-04-14T20:50:00.000Z',
        released_at: '2026-04-14T21:00:00.000Z',
        development: null,
    };

    const mockedBasicVersion: LauncherVersionBasicInfoDto = {
        id: versionId,
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
        created_at: '2026-04-14T20:45:00.000Z',
        updated_at: '2026-04-14T20:50:00.000Z',
        released_at: '2026-04-14T21:00:00.000Z',
    };

    const mockedDevelopment: Record<string, unknown> = {
        candidate: {
            channel: LauncherReleaseChannel.Beta,
            branch: 'beta',
        },
    };

    const mockedPublished: PublishLauncherCandidateVersionResponseDto = {
        version_id: versionId,
        semver: '2.5.0',
        channel: LauncherReleaseChannel.Latest,
        moved_artifacts: 4,
        updated_yml_files: [
            'public/launcher-builds/latest/latest.yml',
            'public/launcher-builds/latest/latest-linux.yml',
        ],
        released_at: '2026-04-15T20:45:00.000Z',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LauncherBackofficeController],
            providers: [
                {
                    provide: LauncherBackofficeFacade,
                    useValue: {
                        getLauncherVersionBasicInfo: jest.fn(),
                        getLauncherVersionDevelopment: jest.fn(),
                        publishCandidateVersion: jest.fn(),
                        releaseCandidateInstallersOnly: jest.fn(),
                        listLauncherVersions: jest.fn(),
                        listCandidateVersions: jest.fn(),
                    },
                },
                {
                    provide: BetterLogger,
                    useClass: BetterLoggerServiceMock,
                },
            ],
        }).compile();

        controller = module.get<LauncherBackofficeController>(
            LauncherBackofficeController,
        );
        launcherBackofficeFacade = module.get(LauncherBackofficeFacade);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should enforce admin-only access metadata', () => {
        const policy = Reflect.getMetadata(
            AUTH_SUBJECT_KEY,
            LauncherBackofficeController,
        );

        expect(policy).toBe(AccessPolicy.AdminOnly);
    });

    it('should list launcher candidate versions', async () => {
        const candidates: LauncherCandidateVersionResponseDto[] = [
            mockedCandidate,
        ];

        launcherBackofficeFacade.listCandidateVersions
            .mockResolvedValue(candidates);

        const response = await controller.listCandidateVersions();

        expect(launcherBackofficeFacade.listCandidateVersions)
            .toHaveBeenCalledTimes(1);
        expect(response.data).toEqual(candidates);
    });

    it('should list launcher versions with pagination and filters', async () => {
        const filters: GetBackofficeLauncherVersionsFilterDto = {
            page: 2,
            per_page: 10,
            state: LauncherVersionState.Released,
            is_current: true,
            channel: LauncherReleaseChannel.Latest,
        };

        const paginated: PaginatedResult<LauncherVersionListItemDto> = {
            items: [mockedVersion],
            meta: {
                page: 2,
                per_page: 10,
                total: 1,
                total_pages: 1,
            },
        };

        launcherBackofficeFacade.listLauncherVersions
            .mockResolvedValue(paginated);

        const response = await controller.listLauncherVersions(filters);

        expect(launcherBackofficeFacade.listLauncherVersions)
            .toHaveBeenCalledWith(filters);
        expect(response.data).toEqual(paginated.items);
        expect(response.meta).toEqual(paginated.meta);
    });

    it('should retrieve launcher version basic info by id', async () => {
        launcherBackofficeFacade.getLauncherVersionBasicInfo
            .mockResolvedValue(mockedBasicVersion);

        const response = await controller.getLauncherVersionBasicInfo(versionId);

        expect(launcherBackofficeFacade.getLauncherVersionBasicInfo)
            .toHaveBeenCalledWith(versionId);
        expect(response.data).toEqual(mockedBasicVersion);
    });

    it('should retrieve launcher version development metadata by id', async () => {
        launcherBackofficeFacade.getLauncherVersionDevelopment
            .mockResolvedValue(mockedDevelopment);

        const response = await controller.getLauncherVersionDevelopment(versionId);

        expect(launcherBackofficeFacade.getLauncherVersionDevelopment)
            .toHaveBeenCalledWith(versionId);
        expect(response.data).toEqual(mockedDevelopment);
    });

    it('should publish launcher candidate version by id', async () => {
        launcherBackofficeFacade.publishCandidateVersion
            .mockResolvedValue(mockedPublished);

        const response = await controller.publishLauncherCandidateVersion(versionId);

        expect(launcherBackofficeFacade.publishCandidateVersion)
            .toHaveBeenCalledWith(versionId);
        expect(response.data).toEqual(mockedPublished);
    });

    it('should release candidate installers only by id', async () => {
        const mockedInstallersOnlyRelease: PublishLauncherCandidateVersionResponseDto = {
            ...mockedPublished,
            moved_artifacts: 2,
            updated_yml_files: [],
        };

        launcherBackofficeFacade.releaseCandidateInstallersOnly
            .mockResolvedValue(mockedInstallersOnlyRelease);

        const response = await controller
            .releaseLauncherCandidateInstallersOnly(versionId);

        expect(launcherBackofficeFacade.releaseCandidateInstallersOnly)
            .toHaveBeenCalledWith(versionId);
        expect(response.data).toEqual(mockedInstallersOnlyRelease);
    });
});
