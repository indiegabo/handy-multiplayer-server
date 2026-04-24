import { Test, TestingModule } from '@nestjs/testing';
import { FilterVersionsUseCase } from '../../../../../../../src/modules/sg/core/use-cases/versions/filter-versions.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
import { GameVersionState } from '@hms/shared-types';
import { SelectQueryBuilder } from 'typeorm';

describe('FilterVersionsUseCase', () => {
    let useCase: FilterVersionsUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;
    let queryBuilder: jest.Mocked<SelectQueryBuilder<Version>>;

    beforeEach(async () => {
        queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        } as any;

        const mockVersionRepository = {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FilterVersionsUseCase,
                {
                    provide: VersionRepository,
                    useValue: mockVersionRepository,
                },
            ],
        }).compile();

        useCase = module.get<FilterVersionsUseCase>(FilterVersionsUseCase);
        versionRepository = module.get(VersionRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    describe('execute', () => {
        const mockVersions: Version[] = [
            {
                id: 'version-1',
                entity_type: 'Game',
                entity_id: 'game-123',
                semver: { raw: '1.0.0', major: 1, minor: 0, patch: 0 },
                state: GameVersionState.UnderDevelopment,
                is_current: false,
                is_prerelease: false,
                notes: null,
                meta: null,
                created_at: new Date('2026-01-10'),
                updated_at: new Date('2026-01-10'),
            } as Version,
            {
                id: 'version-2',
                entity_type: 'Game',
                entity_id: 'game-123',
                semver: { raw: '1.1.0', major: 1, minor: 1, patch: 0 },
                state: GameVersionState.Ready,
                is_current: true,
                is_prerelease: false,
                notes: null,
                meta: null,
                created_at: new Date('2026-01-15'),
                updated_at: new Date('2026-01-15'),
            } as Version,
        ];

        it('should return versions filtered by state', async () => {
            queryBuilder.getMany.mockResolvedValue([mockVersions[0]]);

            const result = await useCase.execute({
                state: GameVersionState.UnderDevelopment,
            });

            expect(result).toEqual([mockVersions[0]]);
            expect(versionRepository.createQueryBuilder).toHaveBeenCalledWith('version');
            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    state: GameVersionState.UnderDevelopment,
                }),
            );
            expect(queryBuilder.orderBy).toHaveBeenCalledWith('version.created_at', 'DESC');
        });

        it('should return versions filtered by is_current flag', async () => {
            queryBuilder.getMany.mockResolvedValue([mockVersions[1]]);

            const result = await useCase.execute({
                is_current: true,
            });

            expect(result).toEqual([mockVersions[1]]);
            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    is_current: true,
                }),
            );
        });

        it('should return versions filtered by is_prerelease flag', async () => {
            queryBuilder.getMany.mockResolvedValue([]);

            const result = await useCase.execute({
                is_prerelease: true,
            });

            expect(result).toEqual([]);
            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    is_prerelease: true,
                }),
            );
        });

        it('should return versions filtered by game_id', async () => {
            queryBuilder.getMany.mockResolvedValue(mockVersions);

            const result = await useCase.execute({
                game_id: 'game-123',
            });

            expect(result).toEqual(mockVersions);
            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    entity_id: 'game-123',
                }),
            );
        });

        it('should apply default entity_type as "Game" when not provided', async () => {
            queryBuilder.getMany.mockResolvedValue(mockVersions);

            await useCase.execute({
                game_id: 'game-123',
            });

            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    entity_type: 'Game',
                }),
            );
        });

        it('should apply custom entity_type when provided', async () => {
            queryBuilder.getMany.mockResolvedValue([]);

            await useCase.execute({
                entity_type: 'Launcher',
            });

            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    entity_type: 'Launcher',
                }),
            );
        });

        it('should filter versions by created_after date', async () => {
            queryBuilder.getMany.mockResolvedValue([mockVersions[1]]);
            const afterDate = new Date('2026-01-12');

            await useCase.execute({
                created_after: afterDate,
            });

            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    created_at: expect.any(Object),
                }),
            );
        });

        it('should filter versions by created_before date', async () => {
            queryBuilder.getMany.mockResolvedValue([mockVersions[0]]);
            const beforeDate = new Date('2026-01-12');

            await useCase.execute({
                created_before: beforeDate,
            });

            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    created_at: expect.any(Object),
                }),
            );
        });

        it('should filter versions by date range (created_after and created_before)', async () => {
            queryBuilder.getMany.mockResolvedValue([mockVersions[0]]);
            const afterDate = new Date('2026-01-08');
            const beforeDate = new Date('2026-01-12');

            await useCase.execute({
                created_after: afterDate,
                created_before: beforeDate,
            });

            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    created_at: expect.any(Array),
                }),
            );
        });

        it('should filter versions by semver raw string', async () => {
            queryBuilder.getMany.mockResolvedValue([mockVersions[0]]);

            await useCase.execute({
                semver_raw: '1.0.0',
            });

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                "version.semver->>'raw' = :raw",
                { raw: '1.0.0' },
            );
        });

        it('should apply multiple filters simultaneously', async () => {
            queryBuilder.getMany.mockResolvedValue([mockVersions[0]]);

            await useCase.execute({
                state: GameVersionState.UnderDevelopment,
                game_id: 'game-123',
                is_current: false,
                is_prerelease: false,
                semver_raw: '1.0.0',
            });

            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    state: GameVersionState.UnderDevelopment,
                    entity_id: 'game-123',
                    is_current: false,
                    is_prerelease: false,
                    entity_type: 'Game',
                }),
            );
            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                "version.semver->>'raw' = :raw",
                { raw: '1.0.0' },
            );
        });

        it('should return empty array when no versions match filters', async () => {
            queryBuilder.getMany.mockResolvedValue([]);

            const result = await useCase.execute({
                state: GameVersionState.Deprecated,
                game_id: 'non-existent-game',
            });

            expect(result).toEqual([]);
            expect(queryBuilder.getMany).toHaveBeenCalled();
        });

        it('should order results by created_at DESC', async () => {
            queryBuilder.getMany.mockResolvedValue(mockVersions);

            await useCase.execute({});

            expect(queryBuilder.orderBy).toHaveBeenCalledWith('version.created_at', 'DESC');
        });

        it('should work with empty filters object', async () => {
            queryBuilder.getMany.mockResolvedValue(mockVersions);

            const result = await useCase.execute({});

            expect(result).toEqual(mockVersions);
            expect(queryBuilder.where).toHaveBeenCalledWith(
                expect.objectContaining({
                    entity_type: 'Game',
                }),
            );
        });
    });
});
