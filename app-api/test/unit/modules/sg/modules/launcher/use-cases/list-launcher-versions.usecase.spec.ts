import { Test, TestingModule } from '@nestjs/testing';
import { LauncherVersionState } from '@hms/shared-types';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import {
    LauncherReleaseChannel,
} from '@src/modules/sg/modules/launcher/dto/create-launcher-candidate-version.dto';
import {
    GetBackofficeLauncherVersionsFilterDto,
} from '@src/modules/sg/modules/launcher/dto/list-launcher-versions.dto';
import {
    ListLauncherVersionsUseCase,
} from '@src/modules/sg/modules/launcher/use-cases/list-launcher-versions.usecase';

describe('ListLauncherVersionsUseCase', () => {
    let useCase: ListLauncherVersionsUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ListLauncherVersionsUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        createQueryBuilder: jest.fn(() => queryBuilder),
                    },
                },
            ],
        }).compile();

        useCase = module.get<ListLauncherVersionsUseCase>(
            ListLauncherVersionsUseCase,
        );
        versionRepository = module.get(VersionRepository);

        jest.clearAllMocks();
    });

    it('should list launcher versions with default pagination', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([
            [
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
                    is_current: false,
                    is_prerelease: true,
                    created_at: new Date('2026-04-14T20:12:00.000Z'),
                    updated_at: new Date('2026-04-14T20:20:00.000Z'),
                    released_at: null,
                    development: {
                        candidate: {
                            channel: LauncherReleaseChannel.Beta,
                        },
                    },
                },
            ],
            1,
        ]);

        const result = await useCase.execute();

        expect(versionRepository.createQueryBuilder)
            .toHaveBeenCalledWith('version');
        expect(queryBuilder.where).toHaveBeenCalledWith(
            'version.entity_type = :entityType',
            {
                entityType: 'Launcher',
            },
        );
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'version.state IN (:...allowedStates)',
            {
                allowedStates: [
                    LauncherVersionState.ReleaseCandidate,
                    LauncherVersionState.Released,
                    LauncherVersionState.Rejected,
                    LauncherVersionState.Deprecated,
                ],
            },
        );
        expect(queryBuilder.orderBy)
            .toHaveBeenCalledWith('version.created_at', 'DESC');
        expect(queryBuilder.addOrderBy)
            .toHaveBeenCalledWith('version.id', 'DESC');
        expect(queryBuilder.skip).toHaveBeenCalledWith(0);
        expect(queryBuilder.take).toHaveBeenCalledWith(20);

        expect(result.meta).toEqual({
            page: 1,
            per_page: 20,
            total: 1,
            total_pages: 1,
        });
        expect(result.items).toHaveLength(1);
        expect(result.items[0].channel).toBe(LauncherReleaseChannel.Beta);
        expect(result.items[0].state)
            .toBe(LauncherVersionState.ReleaseCandidate);
    });

    it('should apply provided filters to the query builder', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

        const filters: GetBackofficeLauncherVersionsFilterDto = {
            term: '2.5.0',
            state: LauncherVersionState.Released,
            is_current: true,
            is_prerelease: false,
            channel: LauncherReleaseChannel.Latest,
            created_after: '2026-04-01T00:00:00.000Z',
            created_before: '2026-04-30T23:59:59.000Z',
            page: 2,
            per_page: 5,
        };

        await useCase.execute(filters);

        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            "LOWER(COALESCE(version.semver->>'raw', '')) LIKE :term",
            { term: '%2.5.0%' },
        );
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'version.state = :state',
            { state: LauncherVersionState.Released },
        );
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'version.is_current = :isCurrent',
            { isCurrent: true },
        );
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'version.is_prerelease = :isPrerelease',
            { isPrerelease: false },
        );
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'version.created_at >= :createdAfter',
            { createdAfter: '2026-04-01T00:00:00.000Z' },
        );
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'version.created_at <= :createdBefore',
            { createdBefore: '2026-04-30T23:59:59.000Z' },
        );
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            expect.stringContaining("version.development->'candidate'->>'channel'"),
            expect.objectContaining({
                requestedChannel: LauncherReleaseChannel.Latest,
            }),
        );

        expect(queryBuilder.skip).toHaveBeenCalledWith(5);
        expect(queryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should infer channel from semver prerelease when metadata is absent', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([
            [
                {
                    id: 'version-3',
                    entity_id: 'launcher-1',
                    semver: {
                        raw: '2.6.0-alpha.3',
                        major: 2,
                        minor: 6,
                        patch: 0,
                        prerelease: 'alpha.3',
                    },
                    state: LauncherVersionState.Released,
                    is_current: false,
                    is_prerelease: true,
                    created_at: new Date('2026-04-14T21:12:00.000Z'),
                    updated_at: new Date('2026-04-14T21:15:00.000Z'),
                    released_at: new Date('2026-04-14T21:20:00.000Z'),
                    development: null,
                },
            ],
            1,
        ]);

        const result = await useCase.execute();

        expect(result.items).toHaveLength(1);
        expect(result.items[0].channel).toBe(LauncherReleaseChannel.Alpha);
        expect(result.items[0].state).toBe(LauncherVersionState.Released);
    });

    it('should always constrain listing to launcher lifecycle states', async () => {
        queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

        await useCase.execute();

        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'version.state IN (:...allowedStates)',
            {
                allowedStates: [
                    LauncherVersionState.ReleaseCandidate,
                    LauncherVersionState.Released,
                    LauncherVersionState.Rejected,
                    LauncherVersionState.Deprecated,
                ],
            },
        );
    });
});
