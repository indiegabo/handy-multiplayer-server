import { Test, TestingModule } from '@nestjs/testing';
import {
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { LauncherVersionState } from '@hms/shared-types';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import {
    StorageService,
} from '@hms-module/modules/storage/services/storage.service';
import { Launcher } from '@src/modules/sg/core/entities/launcher.entity';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import {
    LauncherReleaseChannel,
} from '@src/modules/sg/modules/launcher/dto/create-launcher-candidate-version.dto';
import {
    PublishLauncherCandidateVersionUseCase,
} from '@src/modules/sg/modules/launcher/use-cases/publish-launcher-candidate-version.usecase';

import {
    createMockStorageService,
    MockStorageService,
} from 'test/mocks/core/services/storage.service.mock';

describe('PublishLauncherCandidateVersionUseCase', () => {
    let useCase: PublishLauncherCandidateVersionUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let storageService: MockStorageService;

    const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';
    const launcherId = 'launcher-1';

    const checksumHex = 'a'.repeat(128);

    const candidateArtifacts = [
        {
            platform: 3,
            filename: 'latest-linux.yml',
            s3_key: 'launcher-builds-candidates/latest/latest-linux.yml',
            checksum: checksumHex,
            checksum_type: 'sha512',
        },
        {
            platform: 1,
            filename: 'lung-games-launcher_1.0.0.exe',
            s3_key: 'launcher-builds-candidates/latest/lung-games-launcher_1.0.0.exe',
            checksum: checksumHex,
            checksum_type: 'sha512',
            download_size: 100,
        },
        {
            platform: 3,
            filename: 'lung-games-launcher_1.0.0.AppImage',
            s3_key: 'launcher-builds-candidates/latest/lung-games-launcher_1.0.0.AppImage',
            checksum: checksumHex,
            checksum_type: 'sha512',
            download_size: 200,
        },
    ];

    const buildCandidateVersion = () => ({
        id: versionId,
        entity_type: Launcher.name,
        entity_id: launcherId,
        semver: {
            raw: '1.0.0',
            major: 1,
            minor: 0,
            patch: 0,
        },
        state: LauncherVersionState.ReleaseCandidate,
        is_current: false,
        is_prerelease: false,
        development: {
            candidate: {
                status: 'candidate',
                source: 'github-actions',
                channel: LauncherReleaseChannel.Latest,
                artifacts: candidateArtifacts,
            },
        },
        released_at: null,
    });

    beforeEach(async () => {
        storageService = createMockStorageService({
            'launcher-builds-candidates/latest/latest.yml': {
                content: 'version: 0.0.1\npath: old.exe\n',
            },
            'launcher-builds-candidates/latest/latest-linux.yml': {
                content: 'version: 0.0.1\npath: old.AppImage\n',
            },
            'launcher-builds-candidates/latest/lung-games-launcher_1.0.0.exe': {
                content: 'exe-binary',
            },
            'launcher-builds-candidates/latest/lung-games-launcher_1.0.0.AppImage': {
                content: 'linux-binary',
            },
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PublishLauncherCandidateVersionUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        setAsCurrentVersion: jest.fn(),
                    },
                },
                {
                    provide: StorageService,
                    useValue: storageService,
                },
                {
                    provide: BetterLogger,
                    useValue: {
                        setContext: jest.fn(),
                        log: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<PublishLauncherCandidateVersionUseCase>(
            PublishLauncherCandidateVersionUseCase,
        );

        versionRepository = module.get(VersionRepository);
        versionRepository.findOne
            .mockResolvedValue(buildCandidateVersion() as any);
        versionRepository.save.mockImplementation(async (value: any) => value);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should publish launcher candidate and promote artifacts', async () => {
        const result = await useCase.execute(versionId);

        expect(result).toEqual(
            expect.objectContaining({
                version_id: versionId,
                semver: '1.0.0',
                channel: LauncherReleaseChannel.Latest,
                moved_artifacts: 4,
                updated_yml_files: [
                    'public/launcher-builds/latest/latest-linux.yml',
                    'public/launcher-builds/latest/latest.yml',
                ],
            }),
        );

        expect(storageService.copyObject).toHaveBeenCalledTimes(4);
        expect(storageService.deleteObject).toHaveBeenCalledTimes(4);

        expect(storageService.copyObject).toHaveBeenCalledWith(
            'launcher-builds-candidates/latest/latest.yml',
            'public/launcher-builds/latest/latest.yml',
        );

        expect(storageService.uploadBuffer).not.toHaveBeenCalled();

        expect(versionRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                id: versionId,
                state: LauncherVersionState.Released,
                is_current: true,
            }),
        );

        expect(versionRepository.setAsCurrentVersion).toHaveBeenCalledWith(
            Launcher.name,
            launcherId,
            versionId,
        );
    });

    it('should release installers only without updating updater yml', async () => {
        const result = await useCase.executeInstallersOnly(versionId);

        expect(result).toEqual(
            expect.objectContaining({
                version_id: versionId,
                semver: '1.0.0',
                channel: LauncherReleaseChannel.Latest,
                moved_artifacts: 2,
                updated_yml_files: [],
            }),
        );

        expect(storageService.copyObject).toHaveBeenCalledTimes(2);
        expect(storageService.deleteObject).toHaveBeenCalledTimes(2);

        expect(storageService.copyObject).toHaveBeenCalledWith(
            'launcher-builds-candidates/latest/lung-games-launcher_1.0.0.exe',
            'public/launcher-builds/latest/lung-games-launcher_1.0.0.exe',
        );

        expect(storageService.copyObject).toHaveBeenCalledWith(
            'launcher-builds-candidates/latest/lung-games-launcher_1.0.0.AppImage',
            'public/launcher-builds/latest/lung-games-launcher_1.0.0.AppImage',
        );

        expect(storageService.uploadBuffer).not.toHaveBeenCalled();

        expect(versionRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                id: versionId,
                state: LauncherVersionState.Released,
                is_current: false,
            }),
        );

        expect(versionRepository.setAsCurrentVersion).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when version is not candidate', async () => {
        versionRepository.findOne.mockResolvedValue({
            ...buildCandidateVersion(),
            state: LauncherVersionState.Released,
        } as any);

        await expect(useCase.execute(versionId)).rejects.toThrow(
            ConflictException,
        );
    });

    it('should throw BadRequestException when candidate has no artifacts', async () => {
        versionRepository.findOne.mockResolvedValue({
            ...buildCandidateVersion(),
            development: {
                candidate: {
                    channel: LauncherReleaseChannel.Latest,
                    artifacts: [],
                },
            },
        } as any);

        await expect(useCase.execute(versionId)).rejects.toThrow(
            BadRequestException,
        );
    });
});
