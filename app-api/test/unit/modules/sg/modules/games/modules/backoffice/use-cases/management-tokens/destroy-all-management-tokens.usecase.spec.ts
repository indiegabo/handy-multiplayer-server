// sg/modules/games/backoffice/use-cases/destroy-all-management-tokens.usecase.spec.ts
import { NotFoundException } from '@nestjs/common';
import { DestroyAllManagementTokensUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/management-tokens/destroy-all-management-tokens.usecase';

import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { Game }
    from '@src/modules/sg/core/entities/game.entity';
import { GameManagementTokenRepository }
    from '@src/modules/sg/core/repositories/game-management-token.repository';

describe('DestroyAllManagementTokensUseCase', () => {
    let useCase: DestroyAllManagementTokensUseCase;

    let gameRepository: jest.Mocked<GameRepository>;
    let managementTokenRepository:
        jest.Mocked<GameManagementTokenRepository>;

    beforeEach(() => {
        gameRepository = {
            findOne: jest.fn(),
        } as unknown as jest.Mocked<GameRepository>;

        managementTokenRepository = {
            destroyAllOfGame: jest.fn(),
        } as unknown as jest.Mocked<GameManagementTokenRepository>;

        useCase = new DestroyAllManagementTokensUseCase(
            gameRepository,
            managementTokenRepository,
        );
    });

    it('throws NotFoundException when game does not exist', async () => {
        const gameId = 'missing';
        gameRepository.findOne.mockResolvedValueOnce(null);

        await expect(useCase.execute(gameId))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(gameRepository.findOne).toHaveBeenCalledWith({
            where: { id: gameId },
        });
        expect(managementTokenRepository.destroyAllOfGame)
            .not
            .toHaveBeenCalled();
    });

    it('destroys all tokens when game exists', async () => {
        const gameId = 'game-1';
        const game = { id: gameId } as Game;

        gameRepository.findOne.mockResolvedValueOnce(game);
        managementTokenRepository.destroyAllOfGame
            .mockResolvedValueOnce(undefined);

        await expect(useCase.execute(gameId)).resolves.toBeUndefined();

        expect(managementTokenRepository.destroyAllOfGame)
            .toHaveBeenCalledTimes(1);
        expect(managementTokenRepository.destroyAllOfGame)
            .toHaveBeenCalledWith(game);
    });
});
