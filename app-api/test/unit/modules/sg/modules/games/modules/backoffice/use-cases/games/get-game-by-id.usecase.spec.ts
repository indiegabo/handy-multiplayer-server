import { NotFoundException } from '@nestjs/common';
import { GetGameByIdUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/games/get-game-by-id.usecase';
import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';

describe('GetGameByIdUseCase', () => {
    let useCase: GetGameByIdUseCase;
    let gameRepository: jest.Mocked<GameRepository>;

    beforeEach(() => {
        gameRepository = { findOne: jest.fn() } as any;
        useCase = new GetGameByIdUseCase(gameRepository);
    });

    it('throws when game does not exist', async () => {
        gameRepository.findOne.mockResolvedValueOnce(null);

        await expect(useCase.execute('missing'))
            .rejects.toBeInstanceOf(NotFoundException);

        expect(gameRepository.findOne).toHaveBeenCalledWith({
            where: { id: 'missing' },
        });
    });

    it('returns GameInfoDTO when game is found', async () => {
        const entity = { id: 'g1', name: 'Test' };
        gameRepository.findOne.mockResolvedValueOnce(entity as any);

        const result = await useCase.execute('g1');

        expect(result).toEqual(expect.objectContaining({ id: 'g1', name: 'Test' }));
    });
});
