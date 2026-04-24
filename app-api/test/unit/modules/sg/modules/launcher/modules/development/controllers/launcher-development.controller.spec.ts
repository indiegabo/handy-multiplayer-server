import { Test, TestingModule } from '@nestjs/testing';
import { GameBuildPlatform, LauncherVersionState } from '@hms/shared-types';
import {
    CreateLauncherCandidateVersionDto,
    LauncherCandidateVersionResponseDto,
    LauncherReleaseChannel,
} from '@src/modules/sg/modules/launcher/dto/create-launcher-candidate-version.dto';
import { LauncherDevelopmentController } from '@src/modules/sg/modules/launcher/modules/development/controllers/launcher-development.controller';
import { LauncherDevelopmentFacade } from '@src/modules/sg/modules/launcher/modules/development/facades/launcher-development.facade';

describe('LauncherDevelopmentController', () => {
    let controller: LauncherDevelopmentController;
    let launcherDevelopmentFacade: jest.Mocked<LauncherDevelopmentFacade>;

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
        state: LauncherVersionState.ReleaseCandidate,
        is_prerelease: true,
        channel: LauncherReleaseChannel.Beta,
        created_at: '2026-04-14T19:45:00.000Z',
        development: {
            candidate: {
                status: 'candidate',
            },
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LauncherDevelopmentController],
            providers: [
                {
                    provide: LauncherDevelopmentFacade,
                    useValue: {
                        createCandidateVersion: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<LauncherDevelopmentController>(
            LauncherDevelopmentController,
        );
        launcherDevelopmentFacade = module.get(LauncherDevelopmentFacade);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create launcher candidate version', async () => {
        const payload: CreateLauncherCandidateVersionDto = {
            semver: '2.4.0-beta.2',
            channel: LauncherReleaseChannel.Beta,
            branch: 'beta',
            semantic_changelog: ['feat(updater): improve rollback strategy'],
            artifacts: [
                {
                    platform: GameBuildPlatform.Windows,
                    filename: 'launcher-2.4.0-beta.2.exe',
                    s3_key: 'candidates/launcher/beta/2.4.0-beta.2/win/launcher.exe',
                },
            ],
        };

        launcherDevelopmentFacade.createCandidateVersion
            .mockResolvedValue(mockedCandidate);

        const response = await controller.createCandidateVersion(payload);

        expect(launcherDevelopmentFacade.createCandidateVersion)
            .toHaveBeenCalledWith(payload);
        expect(response.data).toEqual(mockedCandidate);
    });
});
