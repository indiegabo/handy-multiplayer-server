import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
    LauncherVersionState,
} from '@hms/shared-types';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import {
    ListLauncherCandidateVersionsUseCase,
} from '@src/modules/sg/modules/launcher/use-cases/list-launcher-candidate-versions.usecase';
import {
    LauncherReleaseChannel,
} from '@src/modules/sg/modules/launcher/dto/create-launcher-candidate-version.dto';

describe('ListLauncherCandidateVersionsUseCase', () => {
    let useCase: ListLauncherCandidateVersionsUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    const launcherQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
    };

    const launcherOrmRepository = {
        createQueryBuilder: jest.fn(() => launcherQueryBuilder),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ListLauncherCandidateVersionsUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        find: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        getRepository: jest.fn(() => launcherOrmRepository),
                    },
                },
            ],
        }).compile();

        useCase = module.get<ListLauncherCandidateVersionsUseCase>(
            ListLauncherCandidateVersionsUseCase,
        );
        versionRepository = module.get(VersionRepository);

        jest.clearAllMocks();
    });

    it('should return empty list when launcher does not exist', async () => {
        launcherQueryBuilder.getOne.mockResolvedValue(null);

        const result = await useCase.execute();

        expect(result).toEqual([]);
        expect(versionRepository.find).not.toHaveBeenCalled();
    });

    it('should list launcher candidate versions with mapped channels', async () => {
        launcherQueryBuilder.getOne.mockResolvedValue({ id: 'launcher-1' } as any);

        versionRepository.find.mockResolvedValue([
            {
                id: 'version-1',
                entity_id: 'launcher-1',
                semver: {
                    raw: '2.4.0-beta.2',
                    major: 2,
                    minor: 4,
                    patch: 0,
                    prerelease: 'beta.2',
                },
                state: LauncherVersionState.ReleaseCandidate,
                is_prerelease: true,
                created_at: new Date('2026-04-14T20:12:00.000Z'),
                development: {
                    candidate: {
                        channel: LauncherReleaseChannel.Beta,
                    },
                },
            },
            {
                id: 'version-2',
                entity_id: 'launcher-1',
                semver: {
                    raw: '2.5.0-alpha.1',
                    major: 2,
                    minor: 5,
                    patch: 0,
                    prerelease: 'alpha.1',
                },
                state: LauncherVersionState.ReleaseCandidate,
                is_prerelease: true,
                created_at: new Date('2026-04-14T20:14:00.000Z'),
                development: null,
            },
        ] as any);

        const result = await useCase.execute();

        expect(versionRepository.find).toHaveBeenCalledWith({
            where: {
                entity_type: 'Launcher',
                entity_id: 'launcher-1',
                state: LauncherVersionState.ReleaseCandidate,
            },
            order: {
                created_at: 'DESC',
            },
        });

        expect(result).toHaveLength(2);
        expect(result[0].channel).toBe(LauncherReleaseChannel.Beta);
        expect(result[1].channel).toBe(LauncherReleaseChannel.Alpha);
        expect(result[0].state).toBe(LauncherVersionState.ReleaseCandidate);
    });
});
