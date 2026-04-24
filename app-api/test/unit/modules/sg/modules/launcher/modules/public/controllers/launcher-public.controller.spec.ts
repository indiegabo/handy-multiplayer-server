import { Test, TestingModule } from '@nestjs/testing';

import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';

import { FileHost } from '@src/modules/sg/core/enums/file-host.enum';
import { LauncherPublicController } from '@src/modules/sg/modules/launcher/modules/public/controllers/launcher-public.controller';
import { LauncherPublicFacade } from '@src/modules/sg/modules/launcher/modules/public/facades/launcher-public.facade';
import {
    GetLauncherBuildsPaginatedQueryDto,
    LauncherBuildsPage,
} from '@src/modules/sg/modules/launcher/types/requests-dtos';
import {
    GetLauncherVersionEndUserChangelogBySemverRequestDto,
    LauncherVersionEndUserChangelogPublicResponseDto,
} from '@src/modules/sg/modules/launcher/dto/get-launcher-version-end-user-changelog-public.dto';

import { BetterLoggerServiceMock } from 'test/mocks/core/services/better-logger.service.mock';

describe('LauncherPublicController', () => {
    let controller: LauncherPublicController;
    let launcherPublicFacade: jest.Mocked<LauncherPublicFacade>;
    let logger: BetterLoggerServiceMock;

    const mockedPage: LauncherBuildsPage = {
        channel: 'alpha',
        items: [
            {
                version: '1.0.0-alpha.2',
                filename: 'com.lung-interactive.sg-launcher-1.0.0-alpha.2.exe',
                src: 'launcher-builds/alpha/com.lung-interactive.sg-launcher-1.0.0-alpha.2.exe',
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
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LauncherPublicController],
            providers: [
                {
                    provide: LauncherPublicFacade,
                    useValue: {
                        listBuilds: jest.fn(),
                        getEndUserChangelogBySemver: jest.fn(),
                    },
                },
                {
                    provide: BetterLogger,
                    useClass: BetterLoggerServiceMock,
                },
            ],
        }).compile();

        controller = module.get<LauncherPublicController>(
            LauncherPublicController,
        );
        launcherPublicFacade = module.get(LauncherPublicFacade);
        logger = module.get(BetterLogger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return paginated launcher builds', async () => {
        const query: GetLauncherBuildsPaginatedQueryDto = {
            channel: 'alpha',
            platform: 1,
            per_page: 20,
            page: 1,
        };

        launcherPublicFacade.listBuilds.mockResolvedValue(mockedPage);

        const response = await controller.page(query);

        expect(launcherPublicFacade.listBuilds).toHaveBeenCalledWith(query);
        expect(response.data).toEqual(mockedPage);
    });

    it('should log and rethrow errors from facade', async () => {
        const query: GetLauncherBuildsPaginatedQueryDto = {
            channel: 'alpha',
            limit: 10,
        };

        const error = new Error('Invalid channel');
        launcherPublicFacade.listBuilds.mockRejectedValue(error);

        await expect(controller.page(query)).rejects.toThrow('Invalid channel');
        expect(logger.error).toHaveBeenCalledWith('Invalid channel');
    });

    it('should return end-user changelog by semver', async () => {
        const payload: GetLauncherVersionEndUserChangelogBySemverRequestDto = {
            semver_raw: '1.0.0-alpha.19',
        };

        const changelog: LauncherVersionEndUserChangelogPublicResponseDto = {
            semver_raw: '1.0.0-alpha.19',
            end_user_changelog: '## Highlights\n- Better startup flow',
        };

        launcherPublicFacade.getEndUserChangelogBySemver
            .mockResolvedValue(changelog);

        const response = await controller.getEndUserChangelogBySemver(payload);

        expect(launcherPublicFacade.getEndUserChangelogBySemver)
            .toHaveBeenCalledWith(payload.semver_raw);
        expect(response.data).toEqual(changelog);
    });

    it('should log and rethrow changelog errors', async () => {
        const payload: GetLauncherVersionEndUserChangelogBySemverRequestDto = {
            semver_raw: '1.0.0-alpha.19',
        };

        const error = new Error('Version not found');
        launcherPublicFacade.getEndUserChangelogBySemver
            .mockRejectedValue(error);

        await expect(
            controller.getEndUserChangelogBySemver(payload),
        ).rejects.toThrow('Version not found');

        expect(logger.error).toHaveBeenCalledWith('Version not found');
    });
});
