import { GamesBackofficeInit }
    from '../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/init/games-backoffice.init';
import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { ReleaseReadyVersionsUseCase }
    from '@src/modules/sg/modules/games/modules/backoffice/use-cases/versions/release-ready-versions.usecase';

describe('GamesBackofficeInit', () => {
    let service: GamesBackofficeInit;
    let gameRepository: jest.Mocked<GameRepository>;
    let releaseReadyVersionsUseCase: jest.Mocked<ReleaseReadyVersionsUseCase>;

    beforeEach(() => {
        gameRepository = {
            findAll: jest.fn(),
        } as any;

        releaseReadyVersionsUseCase = {
            execute: jest.fn(),
        } as any;

        service = new GamesBackofficeInit(
            gameRepository,
            releaseReadyVersionsUseCase,
        );
    });

    it('renders released versions using semver raw values', async () => {
        gameRepository.findAll.mockResolvedValue([
            { id: 'game-1' } as any,
        ]);

        releaseReadyVersionsUseCase.execute.mockResolvedValue({
            game: { name: 'Fakegotchi' },
            success: true,
            versions: [
                {
                    semver: {
                        raw: '1.2.3',
                        major: 1,
                        minor: 2,
                        patch: 3,
                    },
                },
            ],
            errorMessage: '',
        } as any);

        const result = await service.releaseNewerVersionsForGames();

        expect(result.status).toBe('success');
        expect(result.message)
            .toContain('• Fakegotchi - Released versions: 1.2.3');
        expect(result.message).not.toContain('[object Object]');
    });
});
