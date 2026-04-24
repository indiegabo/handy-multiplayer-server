// sg/modules/games/backoffice/use-cases/revoke-all-management-tokens.usecase.spec.ts
import { NotFoundException } from '@nestjs/common';
import { RevokeAllManagementTokensUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/management-tokens/revoke-all-management-tokens.usecase';

import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { Game }
    from '@src/modules/sg/core/entities/game.entity';
import { GameManagementTokenRepository }
    from '@src/modules/sg/core/repositories/game-management-token.repository';

describe('RevokeAllManagementTokensUseCase', () => {
    let useCase: RevokeAllManagementTokensUseCase;

    let gameRepository: jest.Mocked<GameRepository>;
    let managementTokenRepository:
        jest.Mocked<GameManagementTokenRepository>;

    beforeEach(() => {
        gameRepository = {
            findOne: jest.fn(),
        } as unknown as jest.Mocked<GameRepository>;

        managementTokenRepository = {
            revokeAllOfGame: jest.fn(),
        } as unknown as jest.Mocked<GameManagementTokenRepository>;

        useCase = new RevokeAllManagementTokensUseCase(
            gameRepository,
            managementTokenRepository,
        );
    });

    it('should throw NotFoundException when game does not exist', async () => {
        const gameId = 'missing';
        gameRepository.findOne.mockResolvedValueOnce(null);

        await expect(useCase.execute(gameId))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(gameRepository.findOne).toHaveBeenCalledTimes(1);
        expect(gameRepository.findOne).toHaveBeenCalledWith({
            where: { id: gameId },
        });
        expect(managementTokenRepository.revokeAllOfGame)
            .not
            .toHaveBeenCalled();
    });

    it('should call repository to revoke all tokens when game exists', async () => {
        const gameId = 'game-1';
        const game = { id: gameId } as Game;

        gameRepository.findOne.mockResolvedValueOnce(game);
        managementTokenRepository.revokeAllOfGame.mockResolvedValueOnce(undefined);

        await expect(useCase.execute(gameId)).resolves.toBeUndefined();

        expect(gameRepository.findOne).toHaveBeenCalledTimes(1);
        expect(managementTokenRepository.revokeAllOfGame)
            .toHaveBeenCalledTimes(1);
        expect(managementTokenRepository.revokeAllOfGame)
            .toHaveBeenCalledWith(game);
    });
});
