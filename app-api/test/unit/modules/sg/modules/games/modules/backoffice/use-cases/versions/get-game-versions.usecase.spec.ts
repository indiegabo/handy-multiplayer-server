// sg/modules/games/backoffice/use-cases/get-game-versions.usecase.spec.ts
import { GetGameVersionsUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/get-game-versions.usecase';
import { VersionRepository }
    from '@src/modules/sg/core/repositories/version.repository';
import { GameVersionState }
    from '@hms/shared-types';

describe('GetGameVersionsUseCase', () => {
    let useCase: GetGameVersionsUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(() => {
        versionRepository = {
            find: jest.fn(),
        } as unknown as jest.Mocked<VersionRepository>;

        useCase = new GetGameVersionsUseCase(versionRepository);
    });

    it('returns empty list when there are no versions', async () => {
        const gameId = 'game-0';
        versionRepository.find.mockResolvedValueOnce([]);

        const result = await useCase.execute(gameId);

        expect(result).toEqual([]);
        expect(versionRepository.find).toHaveBeenCalledWith({
            where: { entity_type: 'Game', entity_id: gameId },
            order: { created_at: 'DESC' },
        });
    });

    it('maps versions to DTOs without builds', async () => {
        const gameId = 'game-1';
        const now = new Date();

        const raw = [
            {
                id: 'v2',
                semver: '1.1.0',
                state: GameVersionState.Released,
                is_current: true,
                is_prerelease: false,
                notes: 'Minor improvements',
                released_at: now,
                created_at: now,
            },
            {
                id: 'v1',
                semver: '1.0.0',
                state: GameVersionState.Released,
                is_current: false,
                is_prerelease: false,
                notes: 'Initial release',
                released_at: new Date(now.getTime() - 86400000),
                created_at: new Date(now.getTime() - 86400000),
            },
        ] as any[];

        versionRepository.find.mockResolvedValueOnce(raw);

        const result = await useCase.execute(gameId);

        expect(result).toHaveLength(2);

        expect(result[0].id).toBe('v2');
        expect(result[0].semver).toBe('1.1.0');
        expect(result[0].is_current).toBe(true);
        expect(result[0].notes).toBe('Minor improvements');

        expect(result[1].id).toBe('v1');
        expect(result[1].semver).toBe('1.0.0');
        expect(result[1].is_current).toBe(false);

        expect(versionRepository.find).toHaveBeenCalledWith({
            where: { entity_type: 'Game', entity_id: gameId },
            order: { created_at: 'DESC' },
        });
    });
});
