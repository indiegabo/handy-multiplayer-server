import { Test, TestingModule } from '@nestjs/testing';

import { ListGamesUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/games/list-games.usecase';
import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { GameAvailability, GameType }
    from '@hms/shared-types';
import { ConnectionPlatform }
    from '@src/modules/sg/core/enums/connection-platform.enum';

const paginateQueryBuilderMock = jest.fn();

jest.mock('@hms-module/core/api/pagination/paginate-querybuilder', () => ({
    paginateQueryBuilder: (...args: any[]) => paginateQueryBuilderMock(...args),
}));

describe('ListGamesUseCase', () => {
    let useCase: ListGamesUseCase;
    let gameRepository: jest.Mocked<GameRepository>;

    function createGameRepositoryMock(): jest.Mocked<GameRepository> {
        return {
            createQueryBuilder: jest.fn(),
        } as unknown as jest.Mocked<GameRepository>;
    }

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ListGamesUseCase,
                {
                    provide: GameRepository,
                    useValue: createGameRepositoryMock(),
                },
            ],
        }).compile();

        useCase = module.get(ListGamesUseCase);
        gameRepository = module.get(GameRepository) as jest.Mocked<GameRepository>;
    });

    it('applies all filters and delegates pagination', async () => {
        const qb: any = {
            distinct: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
        };

        gameRepository.createQueryBuilder.mockReturnValue(qb);

        const paginated = {
            items: [{ id: 'g1', name: 'My Game' }],
            meta: {
                page: 2,
                per_page: 10,
                total: 1,
                total_pages: 1,
            },
        };

        paginateQueryBuilderMock.mockResolvedValue(paginated);

        const filters: any = {
            term: 'game',
            type: GameType.Backseat,
            availability: GameAvailability.Available,
            platform: ConnectionPlatform.Twitch,
            page: 2,
            per_page: 10,
            sort: [{ field: 'name', direction: 'asc' }],
        };

        const result = await useCase.execute(filters);

        expect(gameRepository.createQueryBuilder).toHaveBeenCalledWith('game');
        expect(qb.distinct).toHaveBeenCalledWith(true);
        expect(qb.andWhere).toHaveBeenCalledTimes(3);

        expect(paginateQueryBuilderMock).toHaveBeenCalledTimes(1);
        const [_qb, _filters, options] = paginateQueryBuilderMock.mock.calls[0];

        expect(_qb).toBe(qb);
        expect(_filters).toBe(filters);
        expect(options.perPageDefault).toBe(20);
        expect(options.perPageMax).toBe(100);
        expect(options.allowedSort).toEqual(
            expect.objectContaining({
                name: 'game.name',
                created_at: 'game.created_at',
            }),
        );

        expect(result).toEqual(paginated);
    });

    it('does not add conditional filters when none were provided', async () => {
        const qb: any = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            distinct: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
        };

        gameRepository.createQueryBuilder.mockReturnValue(qb);

        const paginated = {
            items: [],
            meta: {
                page: 1,
                per_page: 20,
                total: 0,
                total_pages: 1,
            },
        };

        paginateQueryBuilderMock.mockResolvedValue(paginated);

        const result = await useCase.execute();

        expect(qb.andWhere).not.toHaveBeenCalled();
        expect(paginateQueryBuilderMock).toHaveBeenCalledWith(
            qb,
            undefined,
            expect.any(Object),
        );
        expect(result).toEqual(paginated);
    });
});
