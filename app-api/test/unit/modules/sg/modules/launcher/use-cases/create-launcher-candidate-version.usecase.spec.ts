import { Test, TestingModule } from '@nestjs/testing';
import {
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
    GameBuildPlatform,
    LauncherVersionState,
} from '@hms/shared-types';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import {
    CreateLauncherCandidateVersionUseCase,
} from '@src/modules/sg/modules/launcher/modules/development/use-cases/create-launcher-candidate-version.usecase';
import {
    LauncherReleaseChannel,
} from '@src/modules/sg/modules/launcher/dto/create-launcher-candidate-version.dto';

describe('CreateLauncherCandidateVersionUseCase', () => {
    let useCase: CreateLauncherCandidateVersionUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    const launcherRepository = {
        createQueryBuilder: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const launcherQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
    };

    beforeEach(async () => {
        launcherRepository.createQueryBuilder.mockReturnValue(
            launcherQueryBuilder as any,
        );
        launcherRepository.create.mockImplementation((input: any) => input);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateLauncherCandidateVersionUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findOneBySemverRaw: jest.fn(),
                        create: jest.fn((input: any) => input),
                        save: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        getRepository: jest.fn(() => launcherRepository),
                    },
                },
                {
                    provide: BetterLogger,
                    useValue: {
                        setContext: jest.fn(),
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<CreateLauncherCandidateVersionUseCase>(
            CreateLauncherCandidateVersionUseCase,
        );
        versionRepository = module.get(VersionRepository);

        jest.clearAllMocks();
    });

    it('should create candidate version for an existing launcher', async () => {
        const launcher = { id: 'launcher-1' };
        const createdAt = new Date('2026-04-14T19:10:00.000Z');

        launcherQueryBuilder.getOne.mockResolvedValue(launcher as any);
        versionRepository.findOneBySemverRaw.mockResolvedValue(null);
        versionRepository.save.mockResolvedValue({
            id: 'version-1',
            entity_id: launcher.id,
            semver: {
                raw: '2.4.0-beta.2',
                major: 2,
                minor: 4,
                patch: 0,
                prerelease: 'beta.2',
            },
            state: LauncherVersionState.ReleaseCandidate,
            is_prerelease: true,
            created_at: createdAt,
            development: {
                candidate: {
                    channel: LauncherReleaseChannel.Beta,
                },
            },
        } as any);

        const payload = {
            semver: '2.4.0-beta.2',
            channel: LauncherReleaseChannel.Beta,
            branch: 'beta',
            commit_sha: 'abcdef123456',
            semantic_changelog: ['feat(updater): improve rollback strategy'],
            artifacts: [
                {
                    platform: GameBuildPlatform.Windows,
                    filename: 'launcher-2.4.0-beta.2.exe',
                    s3_key: 'candidates/launcher/beta/2.4.0-beta.2/win/launcher.exe',
                },
            ],
        };

        const result = await useCase.execute(payload as any);

        expect(versionRepository.findOneBySemverRaw).toHaveBeenCalledWith(
            'Launcher',
            launcher.id,
            '2.4.0-beta.2',
        );

        expect(versionRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                entity_type: 'Launcher',
                entity_id: launcher.id,
                state: LauncherVersionState.ReleaseCandidate,
                is_current: false,
                is_prerelease: true,
                notes: null,
            }),
        );

        expect(result).toEqual(
            expect.objectContaining({
                id: 'version-1',
                launcher_id: launcher.id,
                channel: LauncherReleaseChannel.Beta,
                state: LauncherVersionState.ReleaseCandidate,
                is_prerelease: true,
                created_at: createdAt.toISOString(),
            }),
        );
    });

    it('should map candidate artifacts into development metadata', async () => {
        const launcher = { id: 'launcher-1' };

        launcherQueryBuilder.getOne.mockResolvedValue(launcher as any);
        versionRepository.findOneBySemverRaw.mockResolvedValue(null);
        versionRepository.save.mockImplementation(async (value: any) => ({
            ...value,
            id: 'version-mapped',
            created_at: new Date('2026-04-15T10:00:00.000Z'),
        }));

        const payload = {
            semver: '2.5.0-alpha.1',
            channel: LauncherReleaseChannel.Alpha,
            branch: 'alpha',
            commit_sha: 'abcdef1234567890',
            workflow_run_id: 'run-123',
            workflow_run_url: 'https://github.com/lung-interactive/sg-launcher/actions/runs/123',
            generated_at: '2026-04-15T09:50:00.000Z',
            semantic_changelog: [
                'feat(release): add candidate artifact mapping checks',
            ],
            artifacts: [
                {
                    platform: GameBuildPlatform.Windows,
                    filename: 'alpha.yml',
                    s3_key: 'launcher-builds-candidates/alpha/alpha.yml',
                    checksum: 'sha-value-1',
                    checksum_type: 'sha512',
                    download_size: 200,
                    installed_size: 400,
                },
                {
                    platform: GameBuildPlatform.Linux,
                    filename: 'alpha-linux.yml',
                    s3_key: 'launcher-builds-candidates/alpha/alpha-linux.yml',
                    checksum: 'sha-value-2',
                    checksum_type: 'sha512',
                    download_size: 300,
                    installed_size: 600,
                },
            ],
        };

        await useCase.execute(payload as any);

        const createdVersionInput = versionRepository.create
            .mock.calls[0][0] as Record<string, any>;

        expect(createdVersionInput.development).toEqual({
            candidate: {
                status: 'candidate',
                source: 'github-actions',
                channel: LauncherReleaseChannel.Alpha,
                branch: 'alpha',
                commit_sha: 'abcdef1234567890',
                workflow_run_id: 'run-123',
                workflow_run_url:
                    'https://github.com/lung-interactive/sg-launcher/actions/runs/123',
                generated_at: '2026-04-15T09:50:00.000Z',
                semantic_changelog: [
                    'feat(release): add candidate artifact mapping checks',
                ],
                artifacts: [
                    {
                        platform: GameBuildPlatform.Windows,
                        filename: 'alpha.yml',
                        s3_key: 'launcher-builds-candidates/alpha/alpha.yml',
                        checksum: 'sha-value-1',
                        checksum_type: 'sha512',
                        download_size: 200,
                        installed_size: 400,
                    },
                    {
                        platform: GameBuildPlatform.Linux,
                        filename: 'alpha-linux.yml',
                        s3_key: 'launcher-builds-candidates/alpha/alpha-linux.yml',
                        checksum: 'sha-value-2',
                        checksum_type: 'sha512',
                        download_size: 300,
                        installed_size: 600,
                    },
                ],
            },
        });
    });

    it('should create launcher entity when launcher does not exist', async () => {
        launcherQueryBuilder.getOne.mockResolvedValue(null);
        launcherRepository.save.mockResolvedValue({ id: 'launcher-new' } as any);
        versionRepository.findOneBySemverRaw.mockResolvedValue(null);
        versionRepository.save.mockResolvedValue({
            id: 'version-2',
            entity_id: 'launcher-new',
            semver: {
                raw: '3.0.0',
                major: 3,
                minor: 0,
                patch: 0,
            },
            state: LauncherVersionState.ReleaseCandidate,
            is_prerelease: false,
            created_at: new Date('2026-04-14T20:00:00.000Z'),
            development: {},
        } as any);

        await useCase.execute({
            semver: '3.0.0',
            channel: LauncherReleaseChannel.Latest,
            semantic_changelog: ['feat(core): improve update consistency'],
            artifacts: [
                {
                    platform: GameBuildPlatform.Windows,
                    filename: 'launcher-3.0.0.exe',
                    s3_key: 'candidates/launcher/latest/3.0.0/win/launcher.exe',
                },
            ],
        } as any);

        expect(launcherRepository.create).toHaveBeenCalledWith({});
        expect(launcherRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when semver already exists', async () => {
        launcherQueryBuilder.getOne.mockResolvedValue({ id: 'launcher-1' } as any);
        versionRepository.findOneBySemverRaw.mockResolvedValue({
            id: 'version-existing',
        } as any);

        await expect(
            useCase.execute({
                semver: '2.4.0',
                channel: LauncherReleaseChannel.Latest,
                semantic_changelog: ['fix: no-op'],
                artifacts: [
                    {
                        platform: GameBuildPlatform.Windows,
                        filename: 'launcher-2.4.0.exe',
                        s3_key: 'candidates/launcher/latest/2.4.0/win/launcher.exe',
                    },
                ],
            } as any),
        ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid semver', async () => {
        await expect(
            useCase.execute({
                semver: 'invalid-version',
                channel: LauncherReleaseChannel.Alpha,
                semantic_changelog: ['chore: no-op'],
                artifacts: [
                    {
                        platform: GameBuildPlatform.Windows,
                        filename: 'launcher-invalid.exe',
                        s3_key: 'candidates/launcher/alpha/invalid/win/launcher.exe',
                    },
                ],
            } as any),
        ).rejects.toThrow(BadRequestException);
    });
});